import { mergeResponses } from "../src/mergeResponses";
describe(".mergeResponses()", (): void => {
  it('merges the "nodes" array of a response.', async (): Promise<void> => {
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
});
