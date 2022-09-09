import { set, visit } from "./object-helpers";

const mergeResponses = <ResponseType extends object = any>(
  response1: ResponseType,
  response2: ResponseType
): ResponseType => {
  if (Object.keys(response1).length === 0) {
    return Object.assign(response1, response2);
  }

  visit(response2, {
    onObject: (object, path) => {
      if (object.hasOwnProperty("pageInfo")) {
        if (object.hasOwnProperty("nodes")) {
          set(response1, [...path, "nodes"], (values: any) => {
            return [...values, ...object["nodes"]];
          });
        }

        if (object.hasOwnProperty("edges")) {
          set(response1, [...path, "edges"], (values: any) => {
            return [...values, ...object["edges"]];
          });
        }

        set(response1, [...path, "pageInfo"], object.pageInfo);
      }
    },
  });

  return response1;
};

export { mergeResponses };
