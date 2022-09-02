type CursorValue = string | null;
type ForwardSearchPageInfo = {
  hasNextPage: boolean;
  endCursor: CursorValue;
};

type BackwardSearchPageInfo = {
  hasPreviousPage: boolean;
  startCursor: CursorValue;
};

type PageInfo = ForwardSearchPageInfo | BackwardSearchPageInfo;

type PageInfoContext = {
  pageInfo: PageInfo;
  pathInQuery: string[];
};

const isForwardSearch = (
  givenPageInfo: PageInfo
): givenPageInfo is ForwardSearchPageInfo => {
  return givenPageInfo.hasOwnProperty("hasNextPage");
};

const getCursorFrom = (pageInfo: PageInfo): CursorValue =>
  isForwardSearch(pageInfo) ? pageInfo.endCursor : pageInfo.startCursor;

const hasAnotherPage = (pageInfo: PageInfo): boolean =>
  isForwardSearch(pageInfo) ? pageInfo.hasNextPage : pageInfo.hasPreviousPage;

const anyHasAnotherPage = (pageInfos: PageInfoContext[]) =>
  pageInfos.findIndex((pageInfoContext) =>
    hasAnotherPage(pageInfoContext.pageInfo)
  ) !== -1;

export { getCursorFrom, hasAnotherPage, anyHasAnotherPage };

export type { PageInfo, PageInfoContext, CursorValue };
