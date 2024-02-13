import { Octokit } from "@octokit/core";
import { createIterator } from "./iterator";
import { createPaginate } from "./paginate";
export type { PageInfoForward, PageInfoBackward } from "./page-info";
export type { Options } from "./options";

export function paginateGraphql(octokit: Octokit) {
  octokit.graphql;
  return {
    graphql: Object.assign(octokit.graphql, {
      paginate: Object.assign(createPaginate(octokit), {
        iterator: createIterator(octokit),
      }),
    }),
  };
}
