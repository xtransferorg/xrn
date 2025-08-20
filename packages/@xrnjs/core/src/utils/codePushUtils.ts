/** @format */
import { DeviceEventEmitter } from "react-native";
import CodePush, {
  DownloadProgress,
  Package,
  RemotePackage,
} from "@xrnjs/react-native-code-push";
import numeral from "numeral";
import DeviceInfo from "react-native-device-info";
import env from "react-native-config";
import { Platform } from "@xrnjs/modules-core";
import { XRNBundle } from "@xrnjs/bundle";

// 导入Loadin模块
const XTPopViewManager = require("@xrnjs/loading").XRNLoading;

enum DeviceEventEmitterEnum {
  HiddenSplashScreen = "HiddenSplashScreen", //  隐藏splashScreen
  ShowSplashScreen = "ShowSplashScreen",
  ProgressRate = "ProgressRate", // code push 进度
  BootPageState = "BootPageState",
  ConfirmDialogState = "ConfirmDialogState",
  NetworkErrorOnOther = "NetworkErrorOnOther",
  NetworkErrorOnTab = "NetworkErrorOnTab",
  UpdateFundProtocol = "UpdateFundProtocol", // 更新服务协议弹窗,
  RedirectRoutingOnUM = "UpdateFundProtocol", // codepush更新后跳转route
}

enum CodePushErrorKey {
  Timeout = "Timeout",
}

class CustomCodePush extends Error {
  constructor(
    message: string,
    public key: CodePushErrorKey
  ) {
    super(message);
    this.key = key;
  }
}

const CodePushState = (() => {
  let isChecking = false;
  return {
    getIsChecking() {
      return isChecking;
    },
    setIsChecking(value: boolean) {
      if (isChecking === true) {
        console.warn("isChecking 不允许重复赋值");
        return;
      }
      isChecking = value;
    },
  };
})();

function fetchWithTimeout(promise: Promise<any>, timeout = 10 * 1000) {
  let timer: any;
  return Promise.race([
    promise.then((data) => {
      if (timer) {
        clearTimeout(timer);
      }
      return data;
    }),
    new Promise(
      (_, reject) =>
        (timer = setTimeout(() => {
          reject(
            new CustomCodePush(
              "CodePush请求超时:" + timeout,
              CodePushErrorKey.Timeout
            )
          );
        }, timeout)) // 设置超时时间并在超时后返回错误
    ),
  ]);
}

export const checkForUpdate = async (
  timeout?: number
): Promise<RemotePackage | null> => {
  const update = (await fetchWithTimeout(
    CodePush.checkForUpdate(),
    timeout
  )) as RemotePackage | null;

  return update;
};

export async function checkRNUpdate(props?: {
  isMain: boolean;
  shouldUpdate?: boolean;
  timeout?: number;
  onStart?: () => void;
  onDownload?: (progress: number) => void;
  onSuccess?: (downloadPackage: Package) => void;
  onError?: (e: Error) => void;
  onUpToDate?: () => void;
  onNoUpdate?: () => void;
}) {
  // @ts-ignore
  if (props?.isMain && Platform.OS !== "harmony") {
    XTPopViewManager.hide();
  }
  try {
    // 超时时间10s
    function downloadProgressCallback(progress: DownloadProgress) {
      const { totalBytes, receivedBytes } = progress;
      const num = numeral(receivedBytes || 0)
        .divide(totalBytes)
        .value();
      props?.onDownload?.(num || 0);

      XTPopViewManager?.updateProgress?.((num || 0) * 100);
      DeviceEventEmitter.emit(DeviceEventEmitterEnum.ProgressRate, num);
    }

    // 静默更新回调
    async function syncStatusChangedCallbackIsNotMandatory(
      status: CodePush.SyncStatus
    ) {
      switch (status) {
        case CodePush.SyncStatus.UNKNOWN_ERROR: {
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.HiddenSplashScreen);
          props?.onError?.(new Error("CodePush更新失败"));
          break;
        }
        case CodePush.SyncStatus.CHECKING_FOR_UPDATE: {
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.HiddenSplashScreen);
          props?.onSuccess?.(update);
          break;
        }
        case CodePush.SyncStatus.PATCH_ERROR: {
          break;
        }
      }
    }

    // 开始检查回调，确保404页面不会一直loading
    props?.onStart?.();

    // 状态上报的时候会调用 getConfiguration 导致合规检查失败
    // 防止包被回滚 热更新测试
    await CodePush.notifyAppReady();

    // 如果shouldUpdate为true，那么则始终检查更新
    if (!props?.shouldUpdate) {
      // 热更新完成后需要告诉原生热更新没问题，并且这个时候已经检查过了，不需要再次检查
      if (CodePushState.getIsChecking()) {
        syncStatusChangedCallback(CodePush.SyncStatus.UP_TO_DATE);
        console.log("🍉🍉🍉🍉🍉已经检查过更新");
        return;
      }
      CodePushState.setIsChecking(true);
    }

    // 默认超时值为 10 秒
    const timeoutValue = props?.timeout || 10 * 1000;
    const update = await fetchWithTimeout(
      CodePush.checkForUpdate(),
      timeoutValue
    );
    console.log("update", update);
    // 因为checkForUpdate会返回一个对象，所以这里需要判断是否有downloadUrl
    if (!update || (update && !update?.downloadUrl)) {
      syncStatusChangedCallback(CodePush.SyncStatus.UP_TO_DATE);
      console.log("🍉🍉🍉🍉🍉无需更新");
      return;
    }
    if (!update.isMandatory || update.failedInstall) {
      XTPopViewManager.hideLoading();
    }

    // 强制更新回调
    async function syncStatusChangedCallback(status: CodePush.SyncStatus) {
      switch (status) {
        case CodePush.SyncStatus.UP_TO_DATE: {
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.HiddenSplashScreen);
          // 安装成功进行UM的route跳转
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.RedirectRoutingOnUM);
          // 隐藏原生loading
          XTPopViewManager.hideLoading();
          props?.onUpToDate?.();
          break;
        }
        // 下包
        case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.ShowSplashScreen);
          if (update.isMandatory && !props?.isMain) {
            XTPopViewManager.showLoading();
          }
          props?.onDownload?.(0);

          break;
        // 装包
        case CodePush.SyncStatus.UNKNOWN_ERROR:
          DeviceEventEmitter.emit(DeviceEventEmitterEnum.HiddenSplashScreen);
          XTPopViewManager.hideLoading();
          props?.onError?.(new Error("CodePush更新失败"));
          break;

        case CodePush.SyncStatus.UPDATE_INSTALLED:
          props?.onSuccess?.(update);
          if (props?.isMain) {
            Platform.select({
              ios: () => {
                XTPopViewManager.show();
              },
            });
          }
          break;
        case CodePush.SyncStatus.PATCH_ERROR:
          break;
      }
    }

    function downloadReportCallback(progress: DownloadProgress) {
      const { totalBytes, receivedBytes } = progress;
      if (Number(receivedBytes) === Number(totalBytes)) {
      }
      update.isMandatory && downloadProgressCallback(progress);
    }

    const statusCallBack = update.isMandatory
      ? syncStatusChangedCallback
      : syncStatusChangedCallbackIsNotMandatory;
    await CodePush.sync(
      {
        updateDialog: false as any,
        installMode: CodePush.InstallMode.ON_NEXT_RESTART,
        mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
        rollbackRetryOptions: { delayInHours: 1, maxRetryAttempts: 6 },
      },
      statusCallBack,
      downloadReportCallback
    );
  } catch (e) {
    XTPopViewManager.hideLoading();
    DeviceEventEmitter.emit(DeviceEventEmitterEnum.HiddenSplashScreen);
    props?.onError?.(new Error("CodePush更新失败"));
  }
}

// 此方法废弃了，无处调用
export const checkRNVersion = async (
  bundleName: string,
  androidBundleVersion: number,
  iosBundleVersion: number
) => {
  try {
    const bundleInfoJson = await XRNBundle?.getAllBundleInfos?.();
    if (bundleInfoJson) {
      const isUpdate = bundleInfoJson?.bundleInfoList?.some((item: any) => {
        if (item && item.bundleName === bundleName && item.codePushPackage) {
          const bundleVersion = parseInt(
            item.codePushPackage.label.split("v")[1]
          );
          if (Platform.OS === "android") {
            return bundleVersion > androidBundleVersion;
          }
          if (Platform.OS === "ios") {
            return bundleVersion > iosBundleVersion;
          }
          return false;
        }
		return false;
      });
      return !!isUpdate;
    }
  } catch (error) {
    return false;
  }

  return false;
};
export const checkAPPVersion = async (
  androidVersion: string,
  iosVersion: string
) => {
  const appVersion = DeviceInfo.getVersion();
  function compareVersion(version1: string, version2: string) {
    const parts1 = version1.split(".").map((part) => parseInt(part)); // 将版本号1拆分并转换为数字数组
    const parts2 = version2.split(".").map((part) => parseInt(part)); // 将版本号2拆分并转换为数字数组

    // 比较每个部分
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] < parts2[i]) {
        return -1;
      } else if (parts1[i] > parts2[i]) {
        return 1;
      }
    }

    return 0; // 两个版本号相等
  }
  if (Platform.OS === "android") {
    return compareVersion(androidVersion, appVersion) > 0;
  } else {
    return compareVersion(iosVersion, appVersion) > 0;
  }
};

export type CodePushConfiguration = {
  deploymentKey: string;
  serverUrl: string;
};

export const getCodePushServerUrl = async (): Promise<string> => {
  if (Platform.OS === "android") {
    return Promise.resolve(env.CODEPUSH_URL || "");
  }

  const config = await CodePush.getConfiguration();

  return config.serverUrl;
};
