import { describe, expect, it } from "vitest";
import { findPageInfoUnderArray } from "../src/find-page-info-under-array.js";

describe("findPageInfoUnderArray()", (): void => {
  it("returns undefined if the response contains no pageInfo at all", () => {
    expect(
      findPageInfoUnderArray({
        repository: { issues: { nodes: [{ title: "Issue 1" }] } },
      }),
    ).toBeUndefined();
  });

  it("returns undefined for a null response", () => {
    expect(findPageInfoUnderArray(null)).toBeUndefined();
  });

  it("returns undefined for an empty array", () => {
    expect(findPageInfoUnderArray({ nodes: [] })).toBeUndefined();
  });

  it("returns undefined if the response is an array without a pageInfo", () => {
    expect(findPageInfoUnderArray([{ title: "Issue 1" }])).toBeUndefined();
  });

  it("reports the location even if the pageInfo value is not an object", () => {
    expect(findPageInfoUnderArray({ nodes: [{ pageInfo: null }] })).toEqual(
      "nodes[]",
    );
  });

  it("finds a pageInfo nested inside a single array", () => {
    expect(
      findPageInfoUnderArray({
        nodes: [
          {
            timelineItems: {
              pageInfo: { hasNextPage: false, endCursor: "endCursor" },
            },
          },
        ],
      }),
    ).toEqual("nodes[].timelineItems");
  });

  it("finds a pageInfo nested inside multiple arrays", () => {
    expect(
      findPageInfoUnderArray({
        nodes: [
          {
            children: [
              {
                commits: {
                  pageInfo: { hasNextPage: false, endCursor: "endCursor" },
                },
              },
            ],
          },
        ],
      }),
    ).toEqual("nodes[].children[].commits");
  });

  it("finds a pageInfo in the first array entry that has one", () => {
    expect(
      findPageInfoUnderArray({
        nodes: [
          { title: "Issue 1" },
          {
            comments: {
              pageInfo: { hasNextPage: false, endCursor: "endCursor1" },
            },
          },
          {
            comments: {
              pageInfo: { hasNextPage: false, endCursor: "endCursor2" },
            },
          },
        ],
      }),
    ).toEqual("nodes[].comments");
  });

  it("finds a pageInfo when the response root is an array", () => {
    expect(
      findPageInfoUnderArray([
        {
          comments: {
            pageInfo: { hasNextPage: false, endCursor: "endCursor" },
          },
        },
      ]),
    ).toEqual("[].comments");
  });

  it("skips values that are neither objects nor arrays", () => {
    expect(
      findPageInfoUnderArray({
        nodes: [null, 42, "comment", { comments: { pageInfo: null } }],
      }),
    ).toEqual("nodes[].comments");
  });
});
