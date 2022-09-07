import { Octokit } from "@octokit/core";
import { createIteator } from "./iterator";
import { createPaginate } from "./paginate";

export { PageInfoForward, PageInfoBackward } from "./PageInfo";

export function paginateGraphql(octokit: Octokit) {
  return {
    paginateGraphql: Object.assign(createPaginate(octokit), {
      iterator: createIteator(octokit),
    }),
  };
}
