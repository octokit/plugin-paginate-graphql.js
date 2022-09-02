import { Octokit } from "@octokit/core";
import { paginateGraphql } from "../../src/index";
import fetchMock from "fetch-mock";

const PatchedOctokit = Octokit.plugin(paginateGraphql);

const MockOctokit = ({ responses = [{}] }: { responses?: any[] } = {}) => {
  let calledQueries: string[] = [];
  let passedVariables: any[] = [];
  let callCount = 0;
  const mock = fetchMock.sandbox().post(
    "https://api.github.com/graphql",
    (url, options) => {
      calledQueries.push(JSON.parse(options.body!.toString()).query);
      passedVariables.push(JSON.parse(options.body!.toString()).variables);
      callCount = callCount + 1;
      return { data: responses.shift() };
    },
    { repeat: responses.length }
  );

  const octokit = new PatchedOctokit({
    request: {
      fetch: mock,
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
