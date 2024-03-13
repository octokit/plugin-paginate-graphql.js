import { paginateGraphQL, VERSION } from "../pkg/dist-bundle/index.js";

describe("Test package exports", () => {
  it("should export the paginateGraphQL function", () => {
    expect(paginateGraphQL).toBeInstanceOf(Function);
  });
  it("should export the VERSION string", () => {
    expect(VERSION).toStrictEqual("0.0.0-development");
  });
});
