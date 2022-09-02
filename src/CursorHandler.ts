import { MissingCursorChange } from "./errors";
import {
  getCursorFrom,
  hasAnotherPage,
  anyHasAnotherPage,
  PageInfo,
} from "./PageInfo";

type CursorFactory = {
  create: (cursorName?: string) => string;
};

type CursorValues = Record<string, string>;

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

  return {
    cursorFactory,
    extractNextCursors: (pageInfos: PageInfo[]): CursorValues => {
      currentCursorValues = cursors.reduce(
        (acc: CursorValues, cursorName, index) => {
          const pageInfo = pageInfos[index];
          if (
            hasAnotherPage(pageInfo) &&
            getCursorFrom(pageInfo) === currentCursorValues[cursorName]
          ) {
            throw new MissingCursorChange(pageInfo, cursorName);
          }
          acc[cursorName] = getCursorFrom(pageInfos[index]);
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
