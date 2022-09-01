import { Octokit } from "@octokit/core";
import { createIteator } from "./iterator";
import { paginate } from "./paginate";

export function paginateGraphql(octokit: Octokit) {
  return {
    paginateGraphql: Object.assign(paginate(octokit), {
      iterator: createIteator(octokit),
    }),
  };
}
