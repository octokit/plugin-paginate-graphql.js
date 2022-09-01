import { extractPageInfos } from "../src/extractPageInfos";

describe("extractPageInfos()", (): void => {
  it("returns empty array if no pageInfos on object exist.", async (): Promise<void> => {
    expect(extractPageInfos({ test: { nested: "value" } })).toEqual([]);
  });

  it("returns single pageInfo if exists", () => {
    const queryResult = {
      data: {
        repository: {
          issues: {
            nodes: [{ id: "1" }],
            pageInfo: { hasNextPage: true, endCursor: "endCursor" },
          },
        },
      },
    };

    expect(extractPageInfos(queryResult)).toEqual([
      { hasNextPage: true, endCursor: "endCursor" },
    ]);
  });

  it("returns two pageInfos if they are not nested.", async (): Promise<void> => {
    const queryResult = {
      data: {
        repository: {
          issues: {
            nodes: [{ id: "1" }],
            pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
          },
          labels: {
            nodes: [{ id: "2" }],
            pageInfo: { hasNextPage: true, endCursor: "endCursor2" },
          },
        },
      },
    };

    expect(extractPageInfos(queryResult)).toEqual([
      { hasNextPage: true, endCursor: "endCursor1" },
      { hasNextPage: true, endCursor: "endCursor2" },
    ]);
  });
});
