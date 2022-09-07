const isObject = (value: any) =>
  Object.prototype.toString.call(value) === "[object Object]";

type Visitor = {
  onObject: (object: any, path: string[]) => void;
};

const visit = (object: any, visitor: Visitor, path: string[] = []) => {
  for (const key of Object.keys(object)) {
    const currentPath = [...path, key];
    const currentValue = object[key];

    if (currentValue !== null) {
      visitor.onObject(currentValue, currentPath);
    }

    if (isObject(currentValue)) {
      visit(currentValue, visitor, currentPath);
    }
  }
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

export { visit, get, set };

export type { Visitor };
