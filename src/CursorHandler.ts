import { getCursorFrom, PageInfo } from "./PageInfo";

type CursorFactory = {
  create: (cursorName?: string) => string;
};

const asCursorVariable = (cursorName: string) => `$${cursorName}`;

const createCursorHandler = () => {
  const cursors: string[] = [];
  const cursorFactory: CursorFactory = {
    create: (cursorName = `cursor${cursors.length + 1}`) => {
      cursors.push(cursorName);
      return asCursorVariable(cursorName);
    },
  };

  return {
    cursorFactory,
    extractNextCursors: (pageInfos: PageInfo[]) =>
      cursors.reduce((acc: Record<string, any>, cursorName, index) => {
        acc[cursorName] = getCursorFrom(pageInfos[index]);
        return acc;
      }, {}),
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
