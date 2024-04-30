import type { Octokit } from "@octokit/core";
import { createIterator } from "./iterator.js";
import { createPaginate } from "./paginate.js";
export type { PageInfoForward, PageInfoBackward } from "./page-info.js";
export { VERSION } from "./version.js";

// Export the paginateGraphQLInterface type in order to fix TypeScript errors in downstream projects
// The inferred type of 'Octokit' cannot be named without a reference to '@octokit/core/node_modules/@octokit/graphql/types'. This is likely not portable. A type annotation is necessary.
export type paginateGraphQLInterface = {
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
