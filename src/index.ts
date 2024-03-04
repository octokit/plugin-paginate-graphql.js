import type { Octokit } from "@octokit/core";
import { createIterator } from "./iterator.js";
import { createPaginate } from "./paginate.js";
export type { PageInfoForward, PageInfoBackward } from "./page-info.js";

export function paginateGraphQL(octokit: Octokit) {
  octokit.graphql;
  return {
    graphql: Object.assign(octokit.graphql, {
      paginate: Object.assign(createPaginate(octokit), {
        iterator: createIterator(octokit),
      }),
    }),
  };
}
