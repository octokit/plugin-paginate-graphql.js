import { get, set, visit } from "./objectHelpers";

const mergeResponses = (response1: any, response2: any) => {
  if (Object.keys(response1).length === 0) {
    return response2;
  }

  visit(response1, {
    onObject: (object, path) => {
      if (object.hasOwnProperty("pageInfo")) {
        if (object.hasOwnProperty("nodes")) {
          // Overwrite both the nodes and the pageInfo properties
          set(response2, [...path, "nodes"], (values: any) => {
            return [...object["nodes"], ...values];
          });
        }

        if (object.hasOwnProperty("edges")) {
          set(response2, [...path, "edges"], (values: any) => {
            return [...object["edges"], ...values];
          });
        }
        object.pageInfo = get(response2, [...path, "pageInfo"]);
      }
    },
  });

  return response2;
};

export { mergeResponses };
