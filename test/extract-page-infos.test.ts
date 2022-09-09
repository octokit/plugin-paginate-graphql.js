import { extractPageInfos } from "../src/extract-page-info";
import { PageInfoContext } from "../src/page-info";

describe("extractPageInfos()", (): void => {
  it("returns empty array if no pageInfos on object exist.", async (): Promise<void> => {
    expect(extractPageInfos({ test: { nested: "value" } })).toEqual([]);
  });

  it("returns single pageInfo with their path if exists", () => {
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

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext[]>([
      {
        pageInfo: { hasNextPage: true, endCursor: "endCursor" },
        pathInQuery: ["data", "repository", "issues"],
      },
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

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext[]>([
      {
        pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
        pathInQuery: ["data", "repository", "issues"],
      },
      {
        pageInfo: { hasNextPage: true, endCursor: "endCursor2" },
        pathInQuery: ["data", "repository", "labels"],
      },
    ]);
  });

  it("correctly returns null-cursors.", async (): Promise<void> => {
    const queryResult = {
      data: {
        repository: {
          issues: {
            nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    };

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext[]>([
      {
        pageInfo: { hasNextPage: false, endCursor: null },
        pathInQuery: ["data", "repository", "issues"],
      },
    ]);
  });
});
