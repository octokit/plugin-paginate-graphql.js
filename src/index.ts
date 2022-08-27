import { Octokit } from "@octokit/core";
import { paginate } from "./paginate";

export function paginateGraphql(octokit: Octokit) {
  return {
    paginateGraphql: paginate(octokit),
  };
}
