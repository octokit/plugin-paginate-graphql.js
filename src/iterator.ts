import { extractPageInfos } from "./extractPageInfos";
import { Octokit } from "@octokit/core";
import {
  createCursorHandler,
  CursorFactory,
  CursorHandler,
} from "./CursorHandler";
import { anyHasAnotherPage } from "./PageInfo";

type QueryBuilder = (cursor: CursorFactory) => string;

const createIteator = (octokit: Octokit) => {
  return <ResponseType = any>(
    queryBuilder: QueryBuilder,
    initialParameters: Record<string, any> = {}
  ) => {
    const cursorHandler = createCursorHandler();
    const providedQuery = queryBuilder(cursorHandler.cursorFactory);
    const query = ensureQueryHeader(providedQuery, cursorHandler);

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

          const pageInfos = extractPageInfos(response);
          const nextCursors = cursorHandler.extractNextCursors(pageInfos);

          parameters = {
            ...parameters,
            ...nextCursors,
          };

          if (!anyHasAnotherPage(pageInfos)) {
            nextPageExists = false;
          }

          return { done: false, value: response };
        },
      }),
    };
  };
};

function ensureQueryHeader(query: string, cursorHandler: CursorHandler) {
  if (
    query.trim().startsWith("query") ||
    cursorHandler.getCursors().length === 0
  ) {
    return query;
  }

  return `query paginate(${cursorHandler.generateQueryStatement()}) ${query}`;
}

export { createIteator };

export type { QueryBuilder };
