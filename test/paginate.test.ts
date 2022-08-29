import { PageInfo } from "../src/types/PageInfo";
import { expectQuery } from "./testHelpers/expectQuery";
import { MockOctokit } from "./testHelpers/MockOctokit";

type TestResponseType = {
  repository: {
    issues: {
      nodes: Array<{ title: string }>;
      pageInfo: PageInfo;
    };
  };
};

describe("pagination", () => {
  it(".paginate() returns the response data if only one page exists.", async (): Promise<void> => {
    const [givenResponse] = createResponseObjects(1);

    const { octokit } = MockOctokit({
      responses: [givenResponse],
    });

    const actualResponse = await octokit.paginateGraphql(
      (cursor) => `{
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
    }`
    );
    expect(actualResponse).toEqual(givenResponse);
  });

  it(".paginate() adds query function if non given.", async () => {
    const { octokit, getCalledQuery } = MockOctokit({
      responses: createResponseObjects(1),
    });

    await octokit.paginateGraphql<TestResponseType>((cursor) => {
      return `{
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
        }`;
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

  it(".paginate() merges the result of all pages and returns the last pageInfo Object.", async (): Promise<void> => {
    const responses = createResponseObjects(3);
    const { octokit, getCalledQuery, getCallCount, getPassedVariablesForCall } =
      MockOctokit({
        responses,
      });
    const actualResponse = await octokit.paginateGraphql<TestResponseType>(
      (cursor) => `{
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
      }`
    );

    expect(getCallCount()).toBe(3);
    expect(actualResponse).toEqual({
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
    });
  });

  it(".paginate() always passes the next cursor to the next query.", async (): Promise<void> => {
    const responses = createResponseObjects(3);

    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    let issuesCursor: string | undefined;

    await octokit.paginateGraphql<TestResponseType>((cursor) => {
      issuesCursor = cursor.create();
      return `{
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: ${issuesCursor}) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }`;
    });

    const cursorVariable = issuesCursor!.replace(/\$/g, "");
    expect(getCallCount()).toBe(3);
    expect(getPassedVariablesForCall(1)).toBeUndefined();
    expect(getPassedVariablesForCall(2)).toEqual({
      [cursorVariable]: "endCursor1",
    });
    expect(getPassedVariablesForCall(3)).toEqual({
      [cursorVariable]: "endCursor2",
    });
  });

  it(".paginate() allows passing of initial arguments with the help of named cursors.", async (): Promise<void> => {
    const responses = createResponseObjects(2);

    const { octokit, getCalledQuery, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    await octokit.paginateGraphql<TestResponseType>(
      (cursor) => {
        const cursorVariable = cursor.create("namedCursor");
        return `
          query paginate(${cursorVariable}: String, $organization: String!) {
            repository(owner: $organization, name: "rest.js") {
              issues(first: 10, after: ${cursorVariable}) {
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
      },
      { namedCursor: "initialValue", organization: "octokit" }
    );

    expectQuery(getCalledQuery(1)).toEqual(`
      query paginate($namedCursor: String, $organization: String!) {
          repository(owner: $organization, name: "rest.js") {
            issues(first: 10, after: $namedCursor) {
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
    `);
    expect(getPassedVariablesForCall(1)).toEqual({
      namedCursor: "initialValue",
      organization: "octokit",
    });
    expect(getPassedVariablesForCall(2)).toEqual({
      namedCursor: "endCursor1",
      organization: "octokit",
    });
  });

  it(".paginate() simply executes query if no cursors given.", async (): Promise<void> => {
    const { octokit, getCalledQuery, getPassedVariablesForCall } = MockOctokit({
      responses: [{}],
    });

    const simpleQuery = `{
        repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
          repositoryTopics(first: 3) {
            nodes{
              topic
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`;
    const result = await octokit.paginateGraphql((cursor) => simpleQuery);

    expectQuery(getCalledQuery(1)).toEqual(simpleQuery);
  });
});

function createResponseObjects(amount: number): TestResponseType[] {
  return Array.from(Array(amount)).map((value, index) => ({
    repository: {
      issues: {
        nodes: [{ title: `Issue ${index + 1}` }],
        pageInfo: {
          hasNextPage: amount > index + 1,
          endCursor: `endCursor${index + 1}`,
        },
      },
    },
  }));
}
