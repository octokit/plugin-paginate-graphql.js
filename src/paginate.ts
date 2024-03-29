import type { Octokit } from "@octokit/core";
import { mergeResponses } from "./merge-responses.js";
import { createIterator } from "./iterator.js";

const createPaginate = (octokit: Octokit) => {
  const iterator = createIterator(octokit);
  return async <ResponseType extends object = any>(
    query: string,
    initialParameters: Record<string, any> = {},
  ): Promise<ResponseType> => {
    let mergedResponse: ResponseType = {} as ResponseType;
    for await (const response of iterator<ResponseType>(
      query,
      initialParameters,
    )) {
      mergedResponse = mergeResponses<ResponseType>(mergedResponse, response);
    }
    return mergedResponse;
  };
};

export { createPaginate };
