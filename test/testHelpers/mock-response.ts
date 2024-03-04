import type { PageInfo } from "../../src/page-info.js";

type TestResponseType = {
  repository: {
    issues: {
      nodes?: Array<{ title: string }>;
      edges?: Array<{ node: { title: string } }>;
      pageInfo: PageInfo;
    };
  };
};

type Direction = "forward" | "backward";
type DataKeys = "nodes" | "edges";
function createResponsePages({
  amount,
  direction = "forward",
  dataProps = ["nodes"],
}: {
  amount: number;
  direction?: Direction;
  dataProps?: DataKeys[];
}): TestResponseType[] {
  return Array.from(Array(amount)).map((_, index) => {
    const pageInfo: PageInfo =
      direction === "forward"
        ? {
            hasNextPage: amount > index + 1,
            endCursor: `endCursor${index + 1}`,
          }
        : {
            hasPreviousPage: amount > index + 1,
            startCursor: `startCursor${index + 1}`,
          };

    const data = { title: `Issue ${index + 1}` };
    const issues: any = {};
    if (dataProps.includes("nodes")) issues["nodes"] = [data];
    if (dataProps.includes("edges")) issues["edges"] = [{ node: data }];

    return {
      repository: {
        issues: {
          ...issues,
          pageInfo,
        },
      },
    };
  });
}

export { createResponsePages };

export type { TestResponseType };
