import { Octokit } from "@octokit/core";
import { findPageInfos } from "./findPageInfos";

type CursorFactory = {
  create: () => string;
};
type QueryBuilder = (cursor: CursorFactory) => string;

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
      mergedResponse = Object.assign(mergedResponse, response);

      if (
        pageInfos.length === 0 ||
        pageInfos.findIndex((pageInfo) => pageInfo.hasNextPage) === -1
      ) {
        nextPageExists = false;
        break;
      }
    }
    return mergedResponse;
  };
};

export { paginate };
