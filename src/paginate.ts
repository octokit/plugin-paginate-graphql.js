import { Octokit } from "@octokit/core";
import { mergeResponses } from "./mergeResponses";
import { createIteator, QueryBuilder } from "./iterator";

const paginate = (octokit: Octokit) => {
  const iterator = createIteator(octokit);
  return async <ResponseType = any>(
    queryBuilder: QueryBuilder,
    initialParameters: Record<string, any> = {}
  ): Promise<ResponseType> => {
    let mergedResponse: ResponseType = {} as ResponseType;
    for await (const response of iterator<ResponseType>(
      queryBuilder,
      initialParameters
    )) {
      mergedResponse = mergeResponses(mergedResponse, response);
    }
    return mergedResponse;
  };
};

export { paginate };
