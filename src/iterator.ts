import { Octokit } from "@octokit/core";
import { findPageInfos } from "./findPageInfos";
import { mergeResponses } from "./mergeResponses";
import { getCursorFrom, hasAnotherPage, PageInfo } from "./PageInfo";

type CursorFactory = {
  create: (cursorName?: string) => string;
};
type QueryBuilder = (cursor: CursorFactory) => string;

const hasNextPage = (pageInfos: PageInfo[]) =>
  pageInfos.findIndex((pageInfo) => hasAnotherPage(pageInfo)) !== -1;

const asCursorVariable = (cursorName: string) => `$${cursorName}`;

const createIteator = (octokit: Octokit) => {
  return <ResponseType = any>(
    queryBuilder: QueryBuilder,
    initialParameters: Record<string, any> = {}
  ) => {
    const cursors: string[] = [];
    const cursorFactory: CursorFactory = {
      create: (cursorName = `cursor${cursors.length + 1}`) => {
        cursors.push(cursorName);
        return asCursorVariable(cursorName);
      },
    };

    const providedQuery = queryBuilder(cursorFactory);
    const query = ensureQueryHeader(providedQuery, cursors);

    let nextPageExists = true;
    let parameters = { ...initialParameters };

    return {
      [Symbol.asyncIterator]: () => ({
        async next() {
          if (!nextPageExists) return { done: true, value: {} as ResponseType };
          const response = await octokit.graphql<ResponseType>(
            query,
            parameters
          );
          const pageInfos = findPageInfos(response);
          parameters = {
            ...parameters,
            ...cursors.reduce((acc: Record<string, any>, cursorName, index) => {
              acc[cursorName] = getCursorFrom(pageInfos[index]);
              return acc;
            }, {}),
          };
          if (!hasNextPage(pageInfos)) {
            nextPageExists = false;
          }
          return { done: false, value: response };
        },
      }),
    };
  };
};

function ensureQueryHeader(query: string, cursors: string[]) {
  if (query.trim().startsWith("query") || cursors.length === 0) {
    return query;
  }

  const cursorQueryArguments = cursors
    .map((cursorName) => `${asCursorVariable(cursorName)}: String`)
    .join(", ");

  return `query paginate(${cursorQueryArguments}) ${query}`;
}

export { createIteator };

export type { QueryBuilder };
