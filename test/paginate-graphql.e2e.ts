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
      }`
    );
    expect(result).toBeDefined();
    expect(result.repository.repositoryTopics.nodes).toHaveLength(3);
  });
});
