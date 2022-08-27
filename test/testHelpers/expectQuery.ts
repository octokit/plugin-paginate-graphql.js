import { parse } from "graphql";

const parseQuery = (query: string) => parse(query, { noLocation: true });

const expectQuery = (actualQuery: string) => ({
  toEqual: (expectedQuery: string) => {
    expect(parseQuery(actualQuery)).toEqual(parseQuery(expectedQuery));
  },
});

export { expectQuery };
