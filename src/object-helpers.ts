import { MissingPageInfo } from "./errors";

const isObject = (value: any) =>
  Object.prototype.toString.call(value) === "[object Object]";

function findPaginatedResourcePath(responseData: any): string[] {
  const paginatedResourcePath: string[] | null = deepFindPathToProperty(
    responseData,
    "pageInfo",
  );
  if (paginatedResourcePath === null) {
    throw new MissingPageInfo(responseData);
  }
  return paginatedResourcePath;
}

type TreeNode = [key: string, value: any, depth: number];

function getDirectPropertyPath(preOrderTraversalPropertyPath: TreeNode[]) {
  const terminalNodeDepth: number =
    preOrderTraversalPropertyPath[preOrderTraversalPropertyPath.length - 1][2];

  const alreadyConsideredDepth: { [key: string]: boolean } = {};
  const directPropertyPath: TreeNode[] = preOrderTraversalPropertyPath
    .reverse()
    .filter((node: TreeNode) => {
      const nodeDepth: number = node[2];

      if (nodeDepth >= terminalNodeDepth || alreadyConsideredDepth[nodeDepth]) {
        return false;
      }

      alreadyConsideredDepth[nodeDepth] = true;
      return true;
    })
    .reverse();

  return directPropertyPath;
}

function makeTreeNodeChildrenFromData(
  data: any,
  depth: number,
  searchProperty: string,
): TreeNode[] {
  return isObject(data)
    ? Object.keys(data)
        .reverse()
        .sort((a, b) => {
          if (searchProperty === a) {
            return 1;
          }

          if (searchProperty === b) {
            return -1;
          }

          return 0;
        })
        .map((key) => [key, data[key], depth])
    : [];
}

function findPathToObjectContainingProperty(
  data: any,
  searchProperty: string,
): string[] | null {
  const preOrderTraversalPropertyPath: TreeNode[] = [];
  const stack: TreeNode[] = makeTreeNodeChildrenFromData(
    data,
    1,
    searchProperty,
  );

  while (stack.length > 0) {
    const node: TreeNode = stack.pop()!;

    preOrderTraversalPropertyPath.push(node);

    if (searchProperty === node[0]) {
      const directPropertyPath: TreeNode[] = getDirectPropertyPath(
        preOrderTraversalPropertyPath,
      );
      return directPropertyPath.map((node: TreeNode) => node[0]);
    }

    const depth: number = node[2] + 1;
    const edges: TreeNode[] = makeTreeNodeChildrenFromData(
      node[1],
      depth,
      searchProperty,
    );
    stack.push(...edges);
  }

  return null;
}

function deepFindPathToProperty(
  object: any,
  searchProp: string,
): string[] | null {
  return findPathToObjectContainingProperty(object, searchProp);
}

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
  const lastProperty = path[path.length - 1];
  const parentPath = [...path].slice(0, -1);
  const parent = get(object, parentPath);

  if (typeof mutator === "function") {
    parent[lastProperty!] = mutator(parent[lastProperty!]);
  } else {
    parent[lastProperty!] = mutator;
  }
};

export { findPaginatedResourcePath, get, set };
