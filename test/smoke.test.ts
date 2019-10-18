import { paginateGraphql } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(paginateGraphql).toBeInstanceOf(Function);
  });

  it("paginateGraphql.VERSION is set", () => {
    expect(paginateGraphql.VERSION).toEqual("0.0.0-development");
  });
});
