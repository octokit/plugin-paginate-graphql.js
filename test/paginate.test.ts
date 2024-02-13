import fetchMock from "fetch-mock";
import { MissingCursorChange, MissingPageInfo } from "../src/errors";
import { PageInfo } from "../src/page-info";
import { MockOctokit, PatchedOctokit } from "./testHelpers/mock-octokit";
import {
  createResponsePages,
  TestResponseType,
} from "./testHelpers/mock-response";

describe("pagination", () => {
  it(".paginate() returns the response data if only one page exists.", async (): Promise<void> => {
    const [givenResponse] = createResponsePages({ amount: 1 });

    const { octokit } = MockOctokit({
      responses: [givenResponse],
    });

    const actualResponse = await octokit.graphql.paginate(`
      query paginate ($cursor: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
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

    expect(actualResponse).toEqual(givenResponse);
  });

  it(".paginate() merges the result of all pages and returns the last pageInfo Object.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });
    const { octokit, getCallCount } = MockOctokit({ responses });
    const actualResponse = await octokit.graphql.paginate<TestResponseType>(`
        query paginate ($cursor: String) {
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: $cursor) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }`);

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

    await octokit.graphql.paginate<TestResponseType>(`
        query paginate ($cursor: String) {
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: $cursor) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }`);

    expect(getCallCount()).toBe(3);
    expect(getPassedVariablesForCall(1)).toBeUndefined();
    expect(getPassedVariablesForCall(2)).toEqual({ cursor: "endCursor1" });
    expect(getPassedVariablesForCall(3)).toEqual({ cursor: "endCursor2" });
  });

  it(".paginate() allows passing initial variables.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 2 });

    const { octokit, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    await octokit.graphql.paginate<TestResponseType>(
      `
      query paginate($cursor: String, $organization: String!) {
        repository(owner: $organization, name: "rest.js") {
          issues(first: 10, after: $curosr) {
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
    `,
      { cursor: "initialValue", organization: "octokit" },
    );

    expect(getPassedVariablesForCall(1)).toEqual({
      cursor: "initialValue",
      organization: "octokit",
    });
    expect(getPassedVariablesForCall(2)).toEqual({
      cursor: "endCursor1",
      organization: "octokit",
    });
  });

  it(".paginate() simply returns if empty response", async (): Promise<void> => {
    const { octokit, getCallCount } = MockOctokit({
      responses: [
        {
          repository: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      ],
    });

    const result = await octokit.graphql.paginate(`{
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
      }`);

    expect(getCallCount()).toEqual(1);
    expect(result.repository.nodes).toHaveLength(0);
  });

  it('.paginate() paginates backwards using the "startCursor" and "hasPreviousPage" if given.', async (): Promise<void> => {
    const responses = createResponsePages({
      amount: 2,
      direction: "backward",
    });
    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    const actualResponse = await octokit.graphql.paginate<TestResponseType>(`
      query paginate($cursor: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
            nodes {
              title
            }
            pageInfo {
              hasPreviousPage
              startCursor
            }
          }
        }
      }`);

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
      cursor: "startCursor1",
    });
  });

  it(".paginate() also includes data from edges.", async (): Promise<void> => {
    const responses = createResponsePages({
      amount: 2,
      dataProps: ["edges"],
    });
    const { octokit, getCallCount } = MockOctokit({
      responses,
    });
    const actualResponse = await octokit.graphql.paginate<TestResponseType>(
      `query paginate($cursor: String)
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
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
      }`,
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

  it(".paginate.iterator() lets users iterate over pages step by step.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });
    const { octokit } = MockOctokit({ responses });
    const pageIterator = octokit.graphql.paginate.iterator<TestResponseType>(
      `query paginate($cursor: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
            nodes {
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`,
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

  it(".paginate.iterator() allows users to pass `maxPages` parameter and stops at the right place.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });

    const { octokit, getCallCount, getPassedVariablesForCall } = MockOctokit({
      responses,
    });

    const actualResponse = await octokit.graphql.paginate<TestResponseType>(
      `
        query paginate ($cursor: String) {
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, after: $cursor) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }`,
      {},
      { maxPages: 2 },
    );

    expect(actualResponse).toEqual({
      repository: {
        issues: {
          nodes: [{ title: "Issue 1" }, { title: "Issue 2" }],
          pageInfo: { hasNextPage: true, endCursor: "endCursor2" },
        },
      },
    });
    expect(getCallCount()).toBe(2);
    expect(getPassedVariablesForCall(1)).toBeUndefined();
    expect(getPassedVariablesForCall(2)).toEqual({ cursor: "endCursor1" });
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
      await octokit.graphql.paginate(
        `query($cursor: String) {
          repository(owner: "octokit", name: "rest.js") {
            issues(first: 10, before: $cursor) {
              nodes {
                title
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
      }`,
      );
      throw new Error("Should not succeed!");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MissingCursorChange);
      expect(err.message).toMatch(
        /The cursor at "repository.issues" did not change its value "endCursor1".*/,
      );
    }
  });

  it("paginate() errors if pageInfo object is not found.", async (): Promise<void> => {
    const response = {
      repository: {
        issues: {
          nodes: [
            {
              title: "Issue 1",
            },
          ],
        },
      },
    };

    const { octokit } = MockOctokit({ responses: [response] });

    try {
      await octokit.graphql.paginate(`
      query paginate($cursor: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
            nodes {
              title,
            }
          }
        }
      }`);
      throw new Error("Should not succeed!");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MissingPageInfo);
      expect(err.message).toEqual(
        `No pageInfo property found in response. Please make sure to specify the pageInfo in your query. Response-Data: ${JSON.stringify(
          response,
          null,
          2,
        )}`,
      );
    }
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

    await octokit.graphql
      .paginate<TestResponseType>(query)
      .then(() => {
        throw new Error("Should not resolve");
      })
      .catch((error) => {
        expect(error.message).toEqual(
          "Request failed due to following response errors:\n" +
            " - Field 'bioHtml' doesn't exist on type 'User'",
        );
        expect(error.errors).toEqual(mockResponse.errors);
        expect(error.request.query).toEqual(query);
      });
  });

  it(".paginate() passes 500 errors on.", async (): Promise<void> => {
    const mock = fetchMock.sandbox().post("https://api.github.com/graphql", {
      status: 500,
    });

    const octokit = new PatchedOctokit({ request: { fetch: mock } });
    const func = async () =>
      await octokit.graphql.paginate<TestResponseType>(`
      query paginate($cursor: String) {
        repository(owner: "octokit", name: "rest.js") {
          issues(first: 10, after: $cursor) {
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
      }`);

    await expect(func).rejects.toThrow();
  });
});
