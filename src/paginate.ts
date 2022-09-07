import { Octokit } from "@octokit/core";
import { mergeResponses } from "./mergeResponses";
import { createIteator, QueryBuilder } from "./iterator";

const createPaginate = (octokit: Octokit) => {
  const iterator = createIteator(octokit);
  return async <ResponseType extends object = any>(
    queryBuilder: QueryBuilder,
    initialParameters: Record<string, any> = {}
  ): Promise<ResponseType> => {
    let mergedResponse: ResponseType = {} as ResponseType;
    for await (const response of iterator<ResponseType>(
      queryBuilder,
      initialParameters
    )) {
      mergedResponse = mergeResponses<ResponseType>(mergedResponse, response);
    }
    return mergedResponse;
  };
};

export { createPaginate };
