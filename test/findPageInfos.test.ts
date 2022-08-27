import { findPageInfos } from "../src/findPageInfos";

describe("findPageInfos()", (): void => {
  it("returns empty array if no pageInfos on object exist.", async (): Promise<void> => {
    expect(findPageInfos({ test: { nested: "value" } })).toEqual([]);
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

    expect(findPageInfos(queryResult)).toEqual([
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

    expect(findPageInfos(queryResult)).toEqual([
      { hasNextPage: true, endCursor: "endCursor1" },
      { hasNextPage: true, endCursor: "endCursor2" },
    ]);
  });
});
