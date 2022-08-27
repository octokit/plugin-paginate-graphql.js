import { PageInfo } from "./types/PageInfo";

const isObject = (value: any) =>
  Object.prototype.toString.call(value) === "[object Object]";

const findPageInfos = (responseData: any): PageInfo[] => {
  let newPageInfos = [];
  for (const key of Object.keys(responseData)) {
    if (key.includes("pageInfo")) {
      // No need to go deeper as we do not support nested pages
      return [responseData[key]];
    }

    // Only traverse objects as we do not support nested pages
    if (isObject(responseData[key])) {
      newPageInfos.push(...findPageInfos(responseData[key]));
    }
  }
  return newPageInfos;
};

export { findPageInfos };
