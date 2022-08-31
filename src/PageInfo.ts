type ForwardSearchPageInfo = {
  hasNextPage: boolean;
  endCursor: string;
};

type BackwardSearchPageInfo = {
  hasPreviousPage: boolean;
  startCursor: string;
};

type PageInfo = ForwardSearchPageInfo | BackwardSearchPageInfo;

const isForwardSearch = (
  givenPageInfo: PageInfo
): givenPageInfo is ForwardSearchPageInfo => {
  return givenPageInfo.hasOwnProperty("hasNextPage");
};

const getCursorFrom = (pageInfo: PageInfo): string =>
  isForwardSearch(pageInfo) ? pageInfo.endCursor : pageInfo.startCursor;

const hasAnotherPage = (pageInfo: PageInfo): boolean =>
  isForwardSearch(pageInfo) ? pageInfo.hasNextPage : pageInfo.hasPreviousPage;

export { getCursorFrom, hasAnotherPage };

export type { PageInfo };
