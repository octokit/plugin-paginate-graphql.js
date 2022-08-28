const isObject = (value: any) =>
  Object.prototype.toString.call(value) === "[object Object]";

type Visitor = {
  onObject: (object: any, path: string[]) => void;
};

const visit = (object: any, visitor: Visitor, path: string[] = []) => {
  for (const key of Object.keys(object)) {
    const currentPath = [...path, key];
    const currentValue = object[key];

    visitor.onObject(currentValue, currentPath);

    if (isObject(currentValue)) {
      visit(currentValue, visitor, currentPath);
    }
  }
};

/**
 * The interfaces of the "get" and "set" functions orentiate themselves
 * on the lodash-functions by the same name:
 * https://lodash.com/docs/4.17.15#get
 * https://lodash.com/docs/4.17.15#set
 *
 * They are cut down to our purposes, but could be replaced by the lodash version
 */
const get = (object: any, path: string[]) => {
  return path.reduce((current, nextProperty) => current[nextProperty], object);
};

const set = (object: any, path: string[], mutator: (value: unknown) => any) => {
  const lastProperty = path.at(-1);
  const parentPath = [...path].slice(0, -1);
  const parent = get(object, parentPath);
  parent[lastProperty!] = mutator(parent[lastProperty!]);
};

export { visit, get, set };

export type { Visitor };
