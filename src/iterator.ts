import { extractPageInfos } from "./extract-page-info.js";
import type { Octokit } from "@octokit/core";
import { getCursorFrom, hasAnotherPage } from "./page-info.js";
import { MissingCursorChange } from "./errors.js";

const createIterator = (octokit: Octokit) => {
  return <ResponseType = any>(
    query: string,
    initialParameters: Record<string, any> = {},
    stopFunction?: (response: ResponseType, done: () => void) => void,
  ) => {
    let nextPageExists = true;
    let stopEarly = false;
    let parameters = { ...initialParameters };

    return {
      [Symbol.asyncIterator]: () => ({
        async next() {
          if (!nextPageExists || stopEarly) {
            return { done: true, value: {} as ResponseType };
          }

          const response = await octokit.graphql<ResponseType>(
            query,
            parameters,
          );

          stopFunction?.(response, () => (stopEarly = true));

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
