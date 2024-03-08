import { paginateGraphQL } from "../pkg/dist-bundle/index.js";

describe("Test package exports", () => {
  it("should export the paginateGraphQL function", () => {
    expect(paginateGraphQL).toBeInstanceOf(Function);
  });
});
