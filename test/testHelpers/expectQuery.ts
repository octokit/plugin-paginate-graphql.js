import { parse } from "graphql";

const parseQuery = (query: string, type: "actual" | "expected") => {
  try {
    return parse(query, { noLocation: true });
  } catch (ex: any) {
    throw new Error(
      `Error while parsing ${type} query: ${ex.message}\n${query}`
    );
  }
};

const expectQuery = (actualQuery: string) => ({
  toEqual: (expectedQuery: string) => {
    expect(parseQuery(actualQuery, "actual")).toEqual(
      parseQuery(expectedQuery, "expected")
    );
  },
});

export { expectQuery };
