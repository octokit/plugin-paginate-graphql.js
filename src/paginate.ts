import { Octokit } from "@octokit/core";
import { findPageInfos } from "./findPageInfos";
import { mergeResponses } from "./mergeResponses";
import { PageInfo } from "./types/PageInfo";

type CursorFactory = {
  create: () => string;
};
type QueryBuilder = (cursor: CursorFactory) => string;

const hasNextPage = (pageInfos: PageInfo[]) =>
  pageInfos.findIndex((pageInfo) => pageInfo.hasNextPage) !== -1;

const paginate = (octokit: Octokit) => {
  return async <T = any>(queryBuilder: QueryBuilder): Promise<T> => {
    const cursors: string[] = [];
    const cursor = {
      create: () => {
        const cursorName = `$cursor${cursors.length + 1}`;
        cursors.push(cursorName);
        return cursorName;
      },
    };

    const query = queryBuilder(cursor);

    const foundCursors = cursors
      .map((cursorName) => `${cursorName}: String`)
      .join(", ");

    let nextPageExists = true;
    let mergedResponse: T = {} as T;

    while (nextPageExists) {
      const response = await octokit.graphql<T>(
        `query paginate(${foundCursors}) {${query}}`
      );

      const pageInfos = findPageInfos(response);
      // deepMerge Objects
      mergedResponse = mergeResponses(mergedResponse, response);

      if (!hasNextPage(pageInfos)) {
        nextPageExists = false;
        break;
      }
    }
    return mergedResponse;
  };
};

export { paginate };
