import { extractPageInfos } from "./extract-page-info";
import { Octokit } from "@octokit/core";
import { getCursorFrom, hasAnotherPage } from "./page-info";
import { MissingCursorChange } from "./errors";
import type { Options } from "./options";

const createIterator = (octokit: Octokit) => {
  return <ResponseType = any>(
    query: string,
    initialParameters: Record<string, any> = {},
    options: Options = {},
  ) => {
    let nextPageExists = true;
    let parameters = { ...initialParameters };
    const { maxPages } = options;
    let page = 0;

    return {
      [Symbol.asyncIterator]: () => ({
        async next() {
          if (!nextPageExists) return { done: true, value: {} as ResponseType };
          if (maxPages && page >= maxPages) {
            return { done: true, value: {} as ResponseType };
          }

          page += 1;

          const response = await octokit.graphql<ResponseType>(
            query,
            parameters,
          );

          const pageInfoContext = extractPageInfos(response);
          const nextCursorValue = getCursorFrom(pageInfoContext.pageInfo);
          nextPageExists = hasAnotherPage(pageInfoContext.pageInfo);

          if (nextPageExists && nextCursorValue === parameters.cursor) {
            throw new MissingCursorChange(pageInfoContext, nextCursorValue);
          }

          parameters = {
            ...parameters,
            cursor: nextCursorValue,
          };

          return { done: false, value: response };
        },
      }),
    };
  };
};

export { createIterator };
