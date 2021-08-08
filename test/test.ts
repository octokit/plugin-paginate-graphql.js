import { Octokit } from "@octokit/core";
import { paginateGraphql } from "../src";

const MyOctokit = Octokit.plugin(paginateGraphql);

const { TOKEN: auth } = process.env;

const octokit = new MyOctokit({ auth });

const query = ` query ($cursor_repository_stargazers: String, $owner: String!) {
  repository(name: "probot", owner: $owner) {
    stargazers(first: 100, after: $cursor_repository_stargazers) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        login
        company
      }
    }
  }
}
`;

const options = {
  owner: "probot",
};

const foo = async () => {
  try {
    const data = await octokit.graphqlPaginate(query, options);
    console.log(data);
  } catch (e) {
    console.error(e.message);
    throw e;
  }
};

foo();
