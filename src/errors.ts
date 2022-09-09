import { CursorValue, PageInfoContext } from "./page-info";

const generateMessage = (
  path: string[],
  cursorName: string,
  cursorValue: CursorValue
): string =>
  `The cursor at "${path.join(
    ","
  )}" defined by the variable "${cursorName}" did not change its value "${cursorValue}" after a page transition. As cursor values are matched by creation order, please make sure that you place the created cursors in the exact same order in your query as you created them to avoid endless pagination loops.`;

class MissingCursorChange extends Error {
  override name = "MissingCursorChangeError";

  constructor(
    readonly pageInfo: PageInfoContext,
    readonly cursorName: string,
    readonly cursorValue: CursorValue
  ) {
    super(generateMessage(pageInfo.pathInQuery, cursorName, cursorValue));

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { MissingCursorChange };
