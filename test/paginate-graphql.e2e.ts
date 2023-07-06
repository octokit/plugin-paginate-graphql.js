import { Octokit } from "@octokit/core";
import { paginateGraphql } from "../src";

const PatchedOctokit = Octokit.plugin(paginateGraphql);

const token = process.env.E2E_GITHUB_TOKEN;
if (!token) {
  throw new Error(
    "Executing the E2E Tests requires you to pass a GitHub Token as an environment variable named E2E_GITHUB_TOKEN",
  );
}

describe("paginate-graphql-js E2E Test", () => {
  it("works with simple paginated query.", async () => {
    const myOctokit = new PatchedOctokit({
      auth: token,
    });
    const result = await myOctokit.graphql.paginate(
      `query paginate($cursor: String) {
        repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
          repositoryTopics(first: 1, after: $cursor) {
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
      }`,
    );
    expect(result).toBeDefined();
    expect(result.repository.repositoryTopics.nodes).toHaveLength(3);
  });

  it("works with iterated paginated query.", async () => {
    const myOctokit = new PatchedOctokit({
      auth: token,
    });
    const iterator = myOctokit.graphql.paginate.iterator(
      `query paginate($cursor: String) {
        repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
          repositoryTopics(first: 1, after: $cursor) {
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
      }`,
    );

    let iterations = 0;
    for await (const result of iterator) {
      expect(result).toBeDefined();
      expect(result.repository.repositoryTopics.nodes).toHaveLength(1);
      iterations += 1;
    }

    expect(iterations).toEqual(3);
  });
});
