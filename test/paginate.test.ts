import { expectQuery } from "./testHelpers/expectQuery";
import { MockOctokit } from "./testHelpers/MockOctokit";

describe("pagination", () => {
  it(".paginate() returns the response data if only one page exists.", async (): Promise<void> => {
    const givenResponse = {
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }],
        },
        pageInfo: {
          hasNextPage: false,
          endCursor: "endCursor",
        },
      },
    };
    const { octokit } = MockOctokit({
      responses: [givenResponse],
    });
    const actualResponse = await octokit.paginateGraphql(
      (cursor) => `
      repository(owner: "octokit", name: "rest.js") {
        issues(first: 10, after: ${cursor.create()}) {
          nodes {
            title
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      `
    );
    expect(actualResponse).toEqual(givenResponse);
  });

  it(".paginate() adds query function if non given.", async () => {
    const { octokit, getCalledQuery } = MockOctokit();

    await octokit.paginateGraphql((cursor) => {
      return `
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: ${cursor.create()}) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
      `;
    });

    const expected = `
      query paginate($cursor1: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor1) {
            nodes { 
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    expectQuery(getCalledQuery(1)).toEqual(expected);
  });

  it.skip(".paginate() merges the result of subsequent pages.", async (): Promise<void> => {
    const givenResponse1 = {
      repository: {
        issues: { nodes: [{ title: "Issue 1" }] },
        pageInfo: { hasNextPage: true, endCursor: "endCursor1" },
      },
    };
    const givenResponse2 = {
      repository: {
        issues: { nodes: [{ title: "Issue 2" }] },
        pageInfo: { hasNextPage: true, endCursor: "endCursor2" },
      },
    };
    const givenResponse3 = {
      repository: {
        issues: { nodes: [{ title: "Issue 3" }] },
        pageInfo: { hasNextPage: false, endCursor: "endCursor3" },
      },
    };
    const { octokit, getCalledQuery, getCallCount, getPassedVariablesForCall } =
      MockOctokit({
        responses: [givenResponse1, givenResponse2, givenResponse3],
      });
    const actualResponse = await octokit.paginateGraphql(
      (cursor) => `
      repository(owner: "octokit", name: "rest.js") {
        issues(first: 10, after: ${cursor.create()}) {
          nodes {
            title
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      `
    );

    expect(getCallCount()).toBe(3);
    expect(actualResponse).toEqual({
      data: {
        repository: {
          issues: {
            nodes: [
              { title: "Issue 1" },
              { title: "Issue 2" },
              { title: "Issue 3" },
            ],
            pageInfo: { hasNextPage: false, endCursor: "endCursor3" },
          },
        },
      },
    });
  });
});
