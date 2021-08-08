import { VERSION } from "./version";

import { graphqlPaginate } from "./paginate";

import { Octokit } from "@octokit/core";
import { GraphqlPaginiation } from "./types";

/**
 * @param octokit Octokit instance
 * @param options Options passed to Octokit constructor
 */

export function paginateGraphql(octokit: Octokit) {
  return {
    graphqlPaginate: graphqlPaginate.bind(null, octokit),
  } as GraphqlPaginiation;
}
paginateGraphql.VERSION = VERSION;
