import { PageInfo } from "./PageInfo";

const message =
  "At least one cursors did not change it's value after a page transition, which would result in an endless pagination loop. As cursor values are matched by creation order, please make sure that you place the created cursors in the exact same order in your query as you created them.";
class MissingCursorChange extends Error {
  override name = "MissingCursorChangeError";

  constructor(readonly pageInfo: PageInfo, readonly cursorName: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { MissingCursorChange };
