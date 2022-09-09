import { MissingCursorChange } from "./errors";
import {
  getCursorFrom,
  hasAnotherPage,
  PageInfo,
  PageInfoContext,
  CursorValue,
} from "./page-info";

type CursorFactory = {
  create: (cursorName?: string) => string;
};

type CursorValues = Record<string, CursorValue>;

const asCursorVariable = (cursorName: string) => `$${cursorName}`;

const createCursorHandler = () => {
  const cursors: string[] = [];
  const cursorFactory: CursorFactory = {
    create: (cursorName = `cursor${cursors.length + 1}`) => {
      cursors.push(cursorName);
      return asCursorVariable(cursorName);
    },
  };

  let currentCursorValues: CursorValues = {};
  const cursorDidNotChange = (pageInfo: PageInfo, cursorName: string) =>
    hasAnotherPage(pageInfo) &&
    getCursorFrom(pageInfo) === currentCursorValues[cursorName];

  return {
    cursorFactory,
    extractNextCursors: (pageInfos: PageInfoContext[]): CursorValues => {
      currentCursorValues = cursors.reduce(
        (acc: CursorValues, cursorName, index) => {
          const pageInfoContext = pageInfos[index];

          // Can be undefined in case user tried nested pagination or forgot to add
          // pageInfo Object. We warn about this in the iterator class.
          if (!pageInfoContext) {
            return acc;
          }

          const { pageInfo } = pageInfoContext;
          const cursorValue = getCursorFrom(pageInfo);

          if (cursorDidNotChange(pageInfo, cursorName)) {
            throw new MissingCursorChange(
              pageInfoContext,
              cursorName,
              cursorValue
            );
          }

          acc[cursorName] = cursorValue;
          return acc;
        },
        {}
      );
      return currentCursorValues;
    },
    getCursors: () => cursors,
    generateQueryStatement: () =>
      cursors
        .map((cursorName) => `${asCursorVariable(cursorName)}: String`)
        .join(", "),
  };
};

type CursorHandler = ReturnType<typeof createCursorHandler>;

export { createCursorHandler };

export type { CursorFactory, CursorHandler };
