import { MissingPageInfo } from "./errors";

const isObject = (value: any) =>
  Object.prototype.toString.call(value) === "[object Object]";

function findPaginatedResourcePath(responseData: any): string[] {
  const paginatedResourcePath = deepFindPathToProperty(
    responseData,
    "pageInfo"
  );
  if (paginatedResourcePath.length === 0) {
    throw new MissingPageInfo(responseData);
  }
  return paginatedResourcePath;
}

const deepFindPathToProperty = (
  object: any,
  searchProp: string,
  path: string[] = []
): string[] => {
  for (const key of Object.keys(object)) {
    const currentPath = [...path, key];
    const currentValue = object[key];

    if (currentValue.hasOwnProperty(searchProp)) {
      return currentPath;
    }

    if (isObject(currentValue)) {
      const result = deepFindPathToProperty(
        currentValue,
        searchProp,
        currentPath
      );
      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
};

/**
 * The interfaces of the "get" and "set" functions are equal to those of lodash:
 * https://lodash.com/docs/4.17.15#get
 * https://lodash.com/docs/4.17.15#set
 *
 * They are cut down to our purposes, but could be replaced by the lodash calls
 * if we ever want to have that dependency.
 */
const get = (object: any, path: string[]) => {
  return path.reduce((current, nextProperty) => current[nextProperty], object);
};

type Mutator = any | ((value: unknown) => any);

const set = (object: any, path: string[], mutator: Mutator) => {
  const lastProperty = path.at(-1);
  const parentPath = [...path].slice(0, -1);
  const parent = get(object, parentPath);

  if (typeof mutator === "function") {
    parent[lastProperty!] = mutator(parent[lastProperty!]);
  } else {
    parent[lastProperty!] = mutator;
  }
};

export { findPaginatedResourcePath, get, set };
