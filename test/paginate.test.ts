import { PageInfo } from "../src/PageInfo";
import { expectQuery } from "./testHelpers/expectQuery";
import { MockOctokit } from "./testHelpers/MockOctokit";

type TestResponseType = {
  repository: {
    issues: {
      nodes?: Array<{ title: string }>;
      edges?: Array<{ node: { title: string } }>;
      pageInfo: PageInfo;
    };
  };
};

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

  it(".paginate() always passes the next cursor to the next query.", async (): Promise<void> => {
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

  it(".paginate() allows passing of initial arguments with the help of named cursors.", async (): Promise<void> => {
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

  it(".paginate.iterator() lets users iterate over pages step by step.", async (): Promise<void> => {
    const responses = createResponsePages({ amount: 3 });
    const { octokit } = MockOctokit({ responses });
    const pageIterator =
      await octokit.paginateGraphql.iterator<TestResponseType>(
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
});

type Direction = "forward" | "backward";
type DataKeys = "nodes" | "edges";
function createResponsePages({
  amount,
  direction = "forward",
  dataProps = ["nodes"],
}: {
  amount: number;
  direction?: Direction;
  dataProps?: DataKeys[];
}): TestResponseType[] {
  return Array.from(Array(amount)).map((value, index) => {
    const pageInfo: PageInfo =
      direction === "forward"
        ? {
            hasNextPage: amount > index + 1,
            endCursor: `endCursor${index + 1}`,
          }
        : {
            hasPreviousPage: amount > index + 1,
            startCursor: `startCursor${index + 1}`,
          };

    const data = { title: `Issue ${index + 1}` };
    const issues: any = {};
    if (dataProps.includes("nodes")) issues["nodes"] = [data];
    if (dataProps.includes("edges")) issues["edges"] = [{ node: data }];

    return {
      repository: {
        issues: {
          ...issues,
          pageInfo,
        },
      },
    };
  });
}
