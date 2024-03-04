import type { Octokit } from "@octokit/core";
import { createIterator } from "./iterator.js";
import { createPaginate } from "./paginate.js";
export type { PageInfoForward, PageInfoBackward } from "./page-info.js";

type paginateGraphQLInterface = {
  graphql: Octokit["graphql"] & {
    paginate: ReturnType<typeof createPaginate> & {
      iterator: ReturnType<typeof createIterator>;
    };
  };
};

export function paginateGraphQL(octokit: Octokit): paginateGraphQLInterface {
  return {
    graphql: Object.assign(octokit.graphql, {
      paginate: Object.assign(createPaginate(octokit), {
        iterator: createIterator(octokit),
      }),
    }),
  };
}
