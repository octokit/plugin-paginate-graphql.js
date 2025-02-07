import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "../../src/index.js";
import fetchMock from "fetch-mock";

const PatchedOctokit = Octokit.plugin(paginateGraphQL);

const MockOctokit = ({ responses = [{}] }: { responses?: any[] } = {}) => {
  let calledQueries: string[] = [];
  let passedVariables: any[] = [];
  let callCount = 0;
  const mock = fetchMock.createInstance().post(
    "https://api.github.com/graphql",
    ({ options }) => {
      calledQueries.push(JSON.parse(options.body!.toString()).query);
      passedVariables.push(JSON.parse(options.body!.toString()).variables);
      callCount = callCount + 1;
      return { data: responses.shift() };
    },
    { repeat: responses.length },
  );

  const octokit = new PatchedOctokit({
    request: {
      fetch: mock.fetchHandler,
    },
  });

  return {
    octokit,
    getCallCount: () => callCount,
    getCalledQuery: (index: number) => calledQueries[index - 1],
    getPassedVariablesForCall: (index: number) => passedVariables[index - 1],
  };
};

export { MockOctokit, PatchedOctokit };
