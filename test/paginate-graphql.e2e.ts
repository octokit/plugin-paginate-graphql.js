import { Octokit } from "@octokit/core";
import { paginateGraphql } from "../src";
import { MissingCursorChange } from "../src/errors";

const PatchedOctokit = Octokit.plugin(paginateGraphql);

const token = process.env.E2E_GITHUB_TOKEN;
if (!token) {
  throw new Error(
    "Executing the E2E Tests requires you to pass a GitHub Token as an environment variable named E2E_GITHUB_TOKEN"
  );
}

describe("paginate-graphql-js E2E Test", () => {
  it("works with simple, non-paginated query.", async () => {
    const myOctokit = new PatchedOctokit({
      auth: token,
    });

    const result = await myOctokit.paginateGraphql(
      (cursor) => `{
        repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
          repositoryTopics(first: 3) {
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
      }`
    );

    expect(result).toBeDefined();
    expect(result.repository.repositoryTopics.nodes).toHaveLength(3);
  });

  it("works with simple paginated query.", async () => {
    const myOctokit = new PatchedOctokit({
      auth: token,
    });

    const result = await myOctokit.paginateGraphql(
      (cursor) => `{
        repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
          repositoryTopics(first: 1, after: ${cursor.create()}) {
            nodes{
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
      }`
    );

    expect(result).toBeDefined();
    expect(result.repository.repositoryTopics.nodes).toHaveLength(3);
  });

  it("prevents endless pagination when mixing up cursors.", async (): Promise<void> => {
    const myOctokit = new PatchedOctokit({
      auth: token,
    });

    try {
      await myOctokit.paginateGraphql((cursor) => {
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
    } catch (err: any) {
      console.error(err);
      expect(err).toBeInstanceOf(MissingCursorChange);
      expect(err.message).toMatch(
        /The cursor at "repository.issues" defined by the variable "issuesCursor" did not change its value.*/
      );
    }
  });
});
