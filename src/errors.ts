import type { CursorValue, PageInfoContext } from "./page-info.js";

// Todo: Add link to explanation
const generateMessage = (path: string[], cursorValue: CursorValue): string =>
  `The cursor at "${path.join(
    ",",
  )}" did not change its value "${cursorValue}" after a page transition. Please make sure your that your query is set up correctly.`;

class MissingCursorChange extends Error {
  override name = "MissingCursorChangeError";

  constructor(
    readonly pageInfo: PageInfoContext,
    readonly cursorValue: CursorValue,
  ) {
    super(generateMessage(pageInfo.pathInQuery, cursorValue));

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class MissingPageInfo extends Error {
  override name = "MissingPageInfo";

  constructor(readonly response: any) {
    super(
      `No pageInfo property found in response. Please make sure to specify the pageInfo in your query. Response-Data: ${JSON.stringify(
        response,
        null,
        2,
      )}`,
    );

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { MissingCursorChange, MissingPageInfo };
