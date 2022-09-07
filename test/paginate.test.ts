import fetchMock from "fetch-mock";
import { PageInfo } from "../src/PageInfo";
import { expectQuery } from "./testHelpers/expectQuery";
import { MissingCursorChange } from "../src/errors";
import { MockOctokit, PatchedOctokit } from "./testHelpers/MockOctokit";
import {
  createResponsePages,
  TestResponseType,
} from "./testHelpers/MockResponse";

describe("pagination", () => {
  it(".paginate() returns the response data if only one page exists.", async (): Promise<void> => {
    const [givenResponse] = createResponsePages({ amount: 1 });

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
      responses: createResponsePages({ amount: 1 }),
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
    const responses = createResponsePages({ amount: 3 });
    const { octokit, getCallCount } = MockOctokit({ responses });
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

  it(".paginate() passes the endCursor to the next query.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });

    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    await octokit.paginateGraphql<TestResponseType>((cursor) => {
      return `{
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: ${cursor.create("cursorName")}) {
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

    expect(getCallCount()).toBe(3);
    expect(getPassedVariablesForCall(1)).toBeUndefined();
    expect(getPassedVariablesForCall(2)).toEqual({ cursorName: "endCursor1" });
    expect(getPassedVariablesForCall(3)).toEqual({ cursorName: "endCursor2" });
  });

  it(".paginate() allows passing initial variables with the help of named cursors.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 2 });

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

  it(".paginate() simply executes the query once if no cursors given.", async (): Promise<void> => {
    const { octokit, getCalledQuery } = MockOctokit({
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

    await octokit.paginateGraphql((cursor) => simpleQuery);

    expectQuery(getCalledQuery(1)).toEqual(simpleQuery);
  });

  it('.paginate() paginates backwards using the "startCursor" and "hasPreviousPage" if given.', async (): Promise<void> => {
    const responses = createResponsePages({
      amount: 2,
      direction: "backward",
    });
    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });
    const actualResponse = await octokit.paginateGraphql<TestResponseType>(
      (cursor) => `{
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: ${cursor.create("cursorName")}) {
            nodes {
              title
            }
            pageInfo {
              hasPreviousPage
              startCursor
            }
          }
        }
      }`
    );

    expect(getCallCount()).toBe(2);
    expect(actualResponse).toEqual({
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }, { title: "Issue 2" }],
          pageInfo: { hasPreviousPage: false, startCursor: "startCursor2" },
        },
      },
    });
    expect(getPassedVariablesForCall(2)).toEqual({
      cursorName: "startCursor1",
    });
  });

  it(".paginate() also includes data from edges.", async (): Promise<void> => {
    const responses = createResponsePages({
      amount: 2,
      dataProps: ["edges"],
    });
    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });
    const actualResponse = await octokit.paginateGraphql<TestResponseType>(
      (cursor) => `{
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: ${cursor.create()}) {
            edges {
              node {
                title
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`
    );

    expect(getCallCount()).toBe(2);
    expect(actualResponse).toEqual({
      repository: {
        issues: {
          edges: [
            { node: { title: "Issue 1" } },
            { node: { title: "Issue 2" } },
          ],
          pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
        },
      },
    });
  });
  it(".paginate() allows to paginate two resources in parallel and will only merge new pages.", async (): Promise<void> => {
    const [response1, response2]: any[] = createResponsePages({ amount: 2 });

    response1.repository.repositoryTopics = {
      nodes: [{ topic: { name: `Topic 1` } }],
      pageInfo: { hasNextPage: false, endCursor: `endCursor1` },
    };
    response2.repository.repositoryTopics = {
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    const { octokit, getPassedVariablesForCall } = MockOctokit({
      responses: [response1, response2],
    });

    const actualResponse = await octokit.paginateGraphql((cursor) => {
      const topicsCursor = cursor.create("topics");
      const issuesCursor = cursor.create("issues");

      return `{   
          repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
             issues(first: 1, after: ${topicsCursor}) {
                nodes {
                  title
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
              repositoryTopics(first: 1, after: ${issuesCursor}) {
                nodes {
                  topic {
                    name
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }`;
    });

    expect(getPassedVariablesForCall(2)).toEqual({
      issues: "endCursor1",
      topics: "endCursor1",
    });
    expect(actualResponse.repository.issues.nodes).toHaveLength(2);
    expect(actualResponse.repository.repositoryTopics.nodes).toHaveLength(1);
  });

  it(".paginate.iterator() lets users iterate over pages step by step.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });
    const { octokit } = MockOctokit({ responses });
    const pageIterator = octokit.paginateGraphql.iterator<TestResponseType>(
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

    const allIssues: any[] = [];
    const allPageInfos: PageInfo[] = [];
    for await (const result of pageIterator) {
      allIssues.push(result!.repository.issues.nodes![0]);
      allPageInfos.push(result!.repository.issues.pageInfo);
    }

    expect(allIssues).toHaveLength(3);
    expect(allIssues).toEqual([
      { title: "Issue 1" },
      { title: "Issue 2" },
      { title: "Issue 3" },
    ]);

    expect(allPageInfos).toEqual([
      { hasNextPage: true, endCursor: "endCursor1" },
      { hasNextPage: true, endCursor: "endCursor2" },
      { hasNextPage: false, endCursor: "endCursor3" },
    ]);
  });

  it("paginate() throws error with path and variable name if cursors do not change between calls.", async (): Promise<void> => {
    const [responsePage1, responsePage2] = createResponsePages({ amount: 2 });
    responsePage2.repository.issues.pageInfo = {
      ...responsePage1.repository.issues.pageInfo,
    };
    const { octokit } = MockOctokit({
      responses: [responsePage1, responsePage2],
    });

    try {
      await octokit.paginateGraphql(
        (cursor) => `{
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: ${cursor.create("issuesCursor")}) {
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
      throw new Error("Should not succeed!");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MissingCursorChange);
      expect(err.message).toMatch(
        /The cursor at "repository.issues" defined by the variable "issuesCursor" did not change its value "endCursor1".*/
      );
    }
  });

  it("paginate() warns on nested pagination or missing pageInfo due to cursorCount being larger than the pageInfoCount.", async (): Promise<void> => {
    const responses = [
      {
        repository: {
          issues: {
            nodes: [
              {
                title: "Issue 1",
                comments: {
                  nodes: [{ body: "CommentBody" }],
                  pageInfo: {
                    hasNextPage: true,
                    endCurosr: "nestedCursor1",
                  },
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: "endCursor1",
            },
          },
        },
      },
    ];

    const { octokit } = MockOctokit({
      responses,
    });

    jest.spyOn(console, "warn").mockImplementationOnce(() => {});

    await octokit.paginateGraphql((cursor) => {
      const issuesCursor = cursor.create("issuesCursor");
      const commentsCursor = cursor.create("issuesCursor");
      return `{
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: ${issuesCursor}) {
            nodes {
              title,
              comments(first: 10, after: ${commentsCursor}) {
                nodes: {
                  body
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`;
    });

    expect(console.warn).toHaveBeenCalledWith(
      "Only found 1 pageInfo object for 2 provided cursors. Please add the pageInfo to every paginated resource. If you tried nested pagination, please be advise that this is not supported. For more infos, see <url_to_explanation>."
    );

    jest.restoreAllMocks();
  });

  it(".paginate() throws if GraphQl returns error.", async (): Promise<void> => {
    const mockResponse = {
      data: null,
      errors: [
        {
          locations: [
            {
              column: 5,
              line: 3,
            },
          ],
          message: "Field 'bioHtml' doesn't exist on type 'User'",
        },
      ],
    };
    const mock = fetchMock
      .sandbox()
      .post("https://api.github.com/graphql", mockResponse);

    const octokit = new PatchedOctokit({ request: { fetch: mock } });
    const query = `{
        viewer {
          bioHtml
        }
      }`;

    await octokit
      .paginateGraphql<TestResponseType>((cursor) => query)
      .then(() => {
        throw new Error("Should not resolve");
      })
      .catch((error) => {
        expect(error.message).toEqual(
          "Request failed due to following response errors:\n" +
            " - Field 'bioHtml' doesn't exist on type 'User'"
        );
        expect(error.errors).toStrictEqual(mockResponse.errors);
        expect(error.request.query).toEqual(query);
      });
  });

  it(".paginate() passes 500 errors on.", async (): Promise<void> => {
    const mock = fetchMock.sandbox().post("https://api.github.com/graphql", {
      status: 500,
    });

    const octokit = new PatchedOctokit({ request: { fetch: mock } });
    const func = async () =>
      await octokit.paginateGraphql<TestResponseType>(
        (cursor) => `{
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: ${cursor.create()}) {
            edges {
              node {
                title
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`
      );

    await expect(func).rejects.toThrow();
  });
});
