type CursorValue = string | null;

type PageInfoForward = {
  hasNextPage: boolean;
  endCursor: CursorValue;
};

type PageInfoBackward = {
  hasPreviousPage: boolean;
  startCursor: CursorValue;
};

type PageInfo = PageInfoForward | PageInfoBackward;

type PageInfoContext = {
  pageInfo: PageInfo;
  pathInQuery: string[];
};

const isForwardSearch = (
  givenPageInfo: PageInfo,
): givenPageInfo is PageInfoForward => {
  return givenPageInfo.hasOwnProperty("hasNextPage");
};

const getCursorFrom = (pageInfo: PageInfo): CursorValue =>
  isForwardSearch(pageInfo) ? pageInfo.endCursor : pageInfo.startCursor;

const hasAnotherPage = (pageInfo: PageInfo): boolean =>
  isForwardSearch(pageInfo) ? pageInfo.hasNextPage : pageInfo.hasPreviousPage;

export { getCursorFrom, hasAnotherPage };

export type {
  PageInfo,
  PageInfoForward,
  PageInfoBackward,
  PageInfoContext,
  CursorValue,
};
