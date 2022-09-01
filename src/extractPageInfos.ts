import { PageInfo } from "./PageInfo";
import { visit } from "./objectHelpers";

const extractPageInfos = (responseData: any): PageInfo[] => {
  let newPageInfos: PageInfo[] = [];

  visit(responseData, {
    onObject: (object) => {
      if (Boolean(object.pageInfo)) {
        newPageInfos.push(object.pageInfo);
      }
    },
  });

  return newPageInfos;
};

export { extractPageInfos };
