import { findPaginatedResourcePath } from "../src/object-helpers";
import { MissingPageInfo } from "../src/errors";

describe("findPaginatedResourcePath()", (): void => {});

describe("findPaginatedResourcePath()", (): void => {
  it("returns empty array if no pageInfo object exists", async (): Promise<void> => {
    expect(() => {
      findPaginatedResourcePath({ test: { nested: "value" } });
    }).toThrow(MissingPageInfo);
  });

  it("returns correct path for deeply nested pageInfo", async (): Promise<void> => {
    const obj = {
      "branch-out": { x: { y: { z: {} } } },
      a: {
        "branch-out": { x: { y: { z: {} } } },
        b: {
          "branch-out": { x: { y: { z: {} } } },
          c: {
            "branch-out": { x: { y: { z: {} } } },
            d: {
              "branch-out": { x: { y: { z: {} } } },
              e: {
                "branch-out": { x: { y: { z: {} } } },
                f: {
                  pageInfo: {
                    endCursor: "Y3Vyc29yOnYyOpEB",
                    hasNextPage: false,
                  },
                  "branch-out": { x: { y: { z: {} } } },
                },
              },
            },
          },
        },
      },
    };
    expect(findPaginatedResourcePath(obj)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });

  it("returns correct path for shallow nested pageInfo", async (): Promise<void> => {
    const obj = {
      a: {
        pageInfo: {
          endCursor: "Y3Vyc29yOnYyOpEB",
          hasNextPage: false,
        },
        "branch-out": { x: { y: { z: {} } } },
      },
      "branch-out": { x: { y: { z: {} } } },
    };
    expect(findPaginatedResourcePath(obj)).toEqual(["a"]);
  });

  it("returns correct path for pageInfo in the root object", async (): Promise<void> => {
    const obj = {
      pageInfo: {
        endCursor: "Y3Vyc29yOnYyOpEB",
        hasNextPage: false,
      },
      "branch-out": { x: { y: { z: {} } } },
    };
    expect(findPaginatedResourcePath(obj)).toEqual([]);
  });
});
