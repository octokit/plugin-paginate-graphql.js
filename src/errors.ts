import type { CursorValue, PageInfoContext } from "./page-info.js";
import { findPageInfoUnderArray } from "./find-page-info-under-array.js";

// Todo: Add link to explanation
const generateMessage = (path: string[], cursorValue: CursorValue): string =>
  `The cursor at "${path.join(
    ",",
  )}" did not change its value "${cursorValue}" after a page transition. Please make sure your that your query is set up correctly.`;

const generateMissingPageInfoMessage = (
  response: any,
  pageInfoUnderArray: string | undefined,
): string => {
  const responseData = `Response-Data: ${JSON.stringify(response, null, 2)}`;

  // No `pageInfo` at all: the user most likely forgot the selection entirely.
  if (pageInfoUnderArray === undefined) {
    return `No pageInfo property found in the response. Please make sure to specify the pageInfo selection in your query, and that it is reachable from the query root, i.e. that it is not nested inside an array such as "nodes" or "edges". ${responseData}`;
  }

  // There *is* a `pageInfo`, it is just not reachable because it sits inside an
  // array. Telling the user so is the whole point: "not found in the response"
  // reads as a lie when the pageInfo is right there in the dumped data.
  return [
    `No pageInfo property found at a path that is reachable from the query root. Found a pageInfo selection at "${pageInfoUnderArray}" instead, which is nested inside an array.`,
    "",
    `A pageInfo can only be paginated if it is reachable from the query root by traversing plain objects, where "[]" marks an array. The plugin cannot tell which item of an array the connection belongs to: a list such as "nodes" or "edges" can return a different number of items on every request, so the cursor to send back would be ambiguous.`,
    "",
    `To fix the query, move the pageInfo selection out of the array, for example by querying the singular field that returns a single item instead of the list field ("node(id: ...)" instead of "nodes(ids: ...)"), or by requesting the connection from the top level of the query instead of from within a list.`,
    "",
    responseData,
  ].join("\n");
};

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

  /**
   * Path to the `pageInfo` selection in the query, with `[]` marking every array
   * it is nested in, e.g. `nodes[].timelineItems`. Set only when the response does
   * contain a `pageInfo`, but one that cannot be reached from the query root
   * without going through an array. `undefined` when the response contains no
   * `pageInfo` at all.
   */
  readonly pageInfoUnderArray: string | undefined;

  constructor(readonly response: any) {
    const pageInfoUnderArray = findPageInfoUnderArray(response);

    super(generateMissingPageInfoMessage(response, pageInfoUnderArray));

    this.pageInfoUnderArray = pageInfoUnderArray;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { MissingCursorChange, MissingPageInfo };
