import React from "react";

/**
 * 图片加载完成时的回调参数
 */
export type ImageLoadEndCallbackParams = {
  ref: React.RefObject<any>;
  type: "Image";
  props: any;
};

/**
 * 全局回调函数，用于在图片加载完成时通知外部（如 xrn-monitor）
 * xrn-monitor 可以设置这个回调来收集性能数据
 */
let globalImageLoadEndCallback:
  | ((params: ImageLoadEndCallbackParams) => void)
  | null = null;

/**
 * 设置图片加载完成时的全局回调
 * 主要用于性能监控（如 xrn-monitor）注入自己的逻辑
 *
 * @param callback - 回调函数，在图片加载完成时被调用
 */
export function setImageLoadEndCallback(
  callback: ((params: ImageLoadEndCallbackParams) => void) | null
) {
  globalImageLoadEndCallback = callback;
}

/**
 * 内部使用：触发图片加载完成回调
 * @internal
 */
export function triggerImageLoadEndCallback(
  ref: React.RefObject<any>,
  props: any
) {
  if (globalImageLoadEndCallback) {
    globalImageLoadEndCallback({
      ref,
      type: "Image",
      props,
    });
  }
}
