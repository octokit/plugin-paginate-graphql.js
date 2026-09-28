import { describe, expect, it } from "vitest";
import { MissingPageInfo } from "../src/errors.js";
import { extractPageInfos } from "../src/extract-page-info.js";
import type { PageInfoContext } from "../src/page-info.js";

describe("extractPageInfos()", (): void => {
  it("returns throws if no pageInfo object exists", async (): Promise<void> => {
    expect(() => extractPageInfos({ test: { nested: "value" } })).toThrow();
  });

  it("returns pageInfo with their path if exists", () => {
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

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext>({
      pageInfo: { hasNextPage: true, endCursor: "endCursor" },
      pathInQuery: ["data", "repository", "issues"],
    });
  });

  it("returns only first found pageInfo.", async (): Promise<void> => {
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

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext>({
      pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
      pathInQuery: ["data", "repository", "issues"],
    });
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

    expect(extractPageInfos(queryResult)).toEqual<PageInfoContext>({
      pageInfo: { hasNextPage: false, endCursor: null },
      pathInQuery: ["data", "repository", "issues"],
    });
  });

  it("throws a MissingPageInfo error if the response has unexpected structure", async (): Promise<void> => {
    expect(() => extractPageInfos({ unknown1: null, unknown2: 42 })).toThrow(
      MissingPageInfo,
    );
  });

  it("throws a MissingPageInfo error that points at a pageInfo nested inside an array", async (): Promise<void> => {
    // https://github.com/octokit/plugin-paginate-graphql.js/issues/238
    const response = {
      nodes: [
        {
          timelineItems: {
            pageInfo: { hasNextPage: false, endCursor: "endCursor" },
            nodes: [{ __typename: "IssueComment" }],
          },
        },
      ],
    };

    expect(() => extractPageInfos(response)).toThrow(MissingPageInfo);

    try {
      extractPageInfos(response);
      throw new Error("Should not succeed!");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MissingPageInfo);
      expect(err.name).toEqual("MissingPageInfo");
      expect(err.response).toEqual(response);
      expect(err.pageInfoUnderArray).toEqual("nodes[].timelineItems");
      expect(err.message).toContain(
        `Found a pageInfo selection at "nodes[].timelineItems" instead, which is nested inside an array.`,
      );
      expect(err.message).toContain(
        `Response-Data: ${JSON.stringify(response, null, 2)}`,
      );
    }
  });

  it("throws a MissingPageInfo error without a location if there is no pageInfo at all", async (): Promise<void> => {
    const response = { repository: { issues: { nodes: [{ title: "a" }] } } };

    try {
      extractPageInfos(response);
      throw new Error("Should not succeed!");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MissingPageInfo);
      expect(err.pageInfoUnderArray).toBeUndefined();
      expect(err.message).toEqual(
        `No pageInfo property found in the response. Please make sure to specify the pageInfo selection in your query, and that it is reachable from the query root, i.e. that it is not nested inside an array such as "nodes" or "edges". Response-Data: ${JSON.stringify(
          response,
          null,
          2,
        )}`,
      );
    }
  });
});
