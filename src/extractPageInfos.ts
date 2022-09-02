import { PageInfoContext } from "./PageInfo";
import { visit } from "./objectHelpers";

const extractPageInfos = (responseData: any): PageInfoContext[] => {
  let newPageInfos: PageInfoContext[] = [];

  visit(responseData, {
    onObject: (object, path) => {
      if (Boolean(object.pageInfo)) {
        newPageInfos.push({
          pageInfo: object.pageInfo,
          pathInQuery: path,
        });
      }
    },
  });

  return newPageInfos;
};

export { extractPageInfos };
