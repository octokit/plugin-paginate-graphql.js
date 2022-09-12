import { mergeResponses } from "../src/merge-responses";

describe(".mergeResponses()", (): void => {
  it('merges the "nodes" array of a response if it exists.', async (): Promise<void> => {
    const response1 = {
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }],
          pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
        },
      },
    };
    const response2 = {
      repository: {
        issues: {
          nodes: [{ title: "Issue 2" }],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    };

    const result = mergeResponses(response1, response2);

    expect(result).toEqual({
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }, { title: "Issue 2" }],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    });
  });

  it("merges empty results.", async (): Promise<void> => {
    const response1 = {
      repository: {
        issues: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    };

    const result = mergeResponses({} as any, response1);

    expect(result).toEqual({
      repository: {
        issues: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
  });

  it('merges the "edges" array of a response if it exists.', async (): Promise<void> => {
    const response1 = {
      repository: {
        issues: {
          edges: [
            { cursor: "cursor1", node: { title: "Issue 1" } },
            { cursor: "cursor2", node: { title: "Issue 2" } },
          ],
          pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
        },
      },
    };
    const response2 = {
      repository: {
        issues: {
          edges: [{ cursor: "cursor3", node: { title: "Issue 3" } }],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    };

    const result = mergeResponses(response1, response2);

    expect(result).toEqual({
      repository: {
        issues: {
          edges: [
            { cursor: "cursor1", node: { title: "Issue 1" } },
            { cursor: "cursor2", node: { title: "Issue 2" } },
            { cursor: "cursor3", node: { title: "Issue 3" } },
          ],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    });
  });

  it("merges both edges and nodes if they exist.", () => {
    const response1 = {
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }],
          edges: [{ node: { title: "Issue 1" } }],
          pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
        },
      },
    };
    const response2 = {
      repository: {
        issues: {
          nodes: [{ title: "Issue 2" }],
          edges: [{ node: { title: "Issue 2" } }],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    };

    const result = mergeResponses(response1, response2);

    expect(result).toEqual({
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }, { title: "Issue 2" }],
          edges: [
            { node: { title: "Issue 1" } },
            { node: { title: "Issue 2" } },
          ],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    });
  });
});
