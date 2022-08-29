import { Octokit } from "@octokit/core";
import { findPageInfos } from "./findPageInfos";
import { mergeResponses } from "./mergeResponses";
import { PageInfo } from "./types/PageInfo";

type CursorFactory = {
  create: (cursorName?: string) => string;
};
type QueryBuilder = (cursor: CursorFactory) => string;

const hasNextPage = (pageInfos: PageInfo[]) =>
  pageInfos.findIndex((pageInfo) => pageInfo.hasNextPage) !== -1;

const asCursorVariable = (cursorName: string) => `$${cursorName}`;
const paginate = (octokit: Octokit) => {
  return async <T = any>(
    queryBuilder: QueryBuilder,
    initialParameters: Record<string, any> = {}
  ): Promise<T> => {
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
    let mergedResponse: T = {} as T;
    while (nextPageExists) {
      const response = await octokit.graphql<T>(query, parameters);

      // deepMerge Objects
      mergedResponse = mergeResponses(mergedResponse, response);

      const pageInfos = findPageInfos(response);
      if (!hasNextPage(pageInfos)) {
        nextPageExists = false;
        break;
      }

      parameters = {
        ...parameters,
        ...cursors.reduce((acc: Record<string, any>, cursorName, index) => {
          acc[cursorName] = pageInfos[index].endCursor;
          return acc;
        }, {}),
      };
    }
    return mergedResponse;
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

export { paginate };
