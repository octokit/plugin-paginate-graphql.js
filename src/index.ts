import { VERSION } from "./version";

type Octokit = any;
type Options = {
  [option: string]: any;
};

/**
 * @param octokit Octokit instance
 * @param options Options passed to Octokit constructor
 */
export function paginateGraphql(octokit: Octokit, options: Options) {}
paginateGraphql.VERSION = VERSION;
