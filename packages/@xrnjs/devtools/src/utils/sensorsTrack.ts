export const enum SensorEventID {
  FUND_CLICK = "FUND_click",
  FUND_PAGE_VIEW = "FUND_pageview",
}

export const sensorsFundClick = (params: Record<string, any> = {}) => {
  sensorsUtil(SensorEventID.FUND_CLICK, {
    ...params,
  });
};

export const sensorsFundPageView = (params: Record<string, any> = {}) => {
  sensorsUtil(SensorEventID.FUND_PAGE_VIEW, {
    ...params,
  });
};

export const sensorsUtil = (
  _eventID: string,
  _params: Record<string, any> = {}
) => {
  // 神策已移除，保留调用接口以避免影响调试工具页面。
};
