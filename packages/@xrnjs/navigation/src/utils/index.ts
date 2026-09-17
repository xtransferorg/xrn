export const safeStringifyNavigationParams = (
  bundleName: string,
  moduleName?: string,
  params?: object,
) => {
  let jsonParams = "";

  try {
    jsonParams = JSON.stringify(params || {});
  } catch (e) {
    jsonParams = "";
  }

  return jsonParams;
};

export const safeStringify = (obj?: any) => {
  if (!obj) {
    return "";
  }

  let jsonStr = "";

  try {
    jsonStr = JSON.stringify(obj);
  } catch (e) {
    jsonStr = "";
  }

  return jsonStr;
};

const currentTime = () => new Date().getTime();

export const appendDefaultParams = (params?: object) => {
  return Object.assign({}, params || {}, { _startTime: currentTime() });
};
