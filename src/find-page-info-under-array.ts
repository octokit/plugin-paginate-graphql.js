const isObject = (value: unknown): value is Record<string | number, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

/**
 * Looks for a `pageInfo` selection the way `findPaginatedResourcePath()` cannot:
 * it descends into arrays as well as into plain objects.
 *
 * `findPaginatedResourcePath()` stops at arrays on purpose, because a connection
 * cannot be paginated through a list. Every match found here therefore sits
 * behind at least one array, which makes it a useful hint for the user: the
 * `pageInfo` they selected is in the response, it is just unreachable.
 *
 * The returned path is written the way it would be read in a query, with `[]`
 * marking each array on the way down, e.g. `nodes[].timelineItems`.
 */
const findPageInfoUnderArray = (responseData: unknown): string | undefined => {
  const search = (value: unknown, path: string): string | undefined => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const result = search(entry, `${path}[]`);
        if (result !== undefined) {
          return result;
        }
      }
      return undefined;
    }

    if (!isObject(value)) {
      return undefined;
    }

    if (value.hasOwnProperty("pageInfo")) {
      return path;
    }

    for (const key of Object.keys(value)) {
      const result = search(value[key], path === "" ? key : `${path}.${key}`);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  };

  return search(responseData, "");
};

export { findPageInfoUnderArray };
