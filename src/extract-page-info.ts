import type { PageInfoContext } from "./page-info.js";
import { findPaginatedResourcePath, get } from "./object-helpers.js";

const extractPageInfos = (responseData: any): PageInfoContext => {
  const pageInfoPath = findPaginatedResourcePath(responseData);

  return {
    pathInQuery: pageInfoPath,
    pageInfo: get(responseData, [...pageInfoPath, "pageInfo"]),
  };
};

export { extractPageInfos };
