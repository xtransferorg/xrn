import AsyncStorage from "@react-native-async-storage/async-storage";
import { isEmpty } from "lodash";
import { Dimensions, Linking } from "react-native";
import CodePush from "@xrnjs/react-native-code-push";
import RNConfig from "react-native-config";
import DeviceInfo from "react-native-device-info";
import RNFS from "react-native-fs";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { Platform } from "@xrnjs/modules-core";

const UpdateKey = "@xrnjs/app-update-internal";

export type UpdateMethod = "market" | "in_app";
export type InAppUpdatePath = "in_app" | "market_fallback_in_app";
export type AppUpdateFailureType = "store_open" | "in_app";
export interface AppUpdateFailureContext {
  failureType: AppUpdateFailureType;
  channel: string;
  failureReason: string;
  actualUpdatePath?: InAppUpdatePath;
}
export type OnUpdateFailure = (
  error: unknown,
  context: AppUpdateFailureContext,
) => void;
const STORE_FAILURE_REASONS = new Set([
  "market_not_installed",
  "app_detail_invalid_params",
  "app_detail_unavailable",
  "store_open_failed",
]);

class AppUpdateError extends Error {
  constructor(
    readonly failureReason: string,
    readonly cause?: unknown,
  ) {
    super(failureReason);
    this.name = "AppUpdateError";
  }
}

interface DownloadCallback {
  begin?: () => void;
  progressing?: (
    res: { bytesWritten: number; contentLength: number },
    progress: number,
  ) => void;
  completed?: () => void;
  error?: (error: unknown) => void;
  onUpdateFailure?: OnUpdateFailure;
}

export enum Channel {
  googlePlay = "googlePlay",
  appGallery = "AppGallery",
  huawei = "huawei",
  xiaomi = "xiaomi",
  oppo = "oppo",
  vivo = "vivo",
  honor = "honor",
  tencent = "tencent",
}

function setAppCacheUpdateKey(update: Update) {
  const appVersion = DeviceInfo.getVersion();
  return AsyncStorage.setItem(
    UpdateKey,
    JSON.stringify(
      Object.assign(update, {
        currentAppVersion: appVersion,
      }),
    ),
  );
}

function getUpdateKey(): Promise<Update & { currentAppVersion: string }> {
  return AsyncStorage.getItem(UpdateKey)
    .then((res) => JSON.parse(res || "{}"))
    .catch(() => {});
}

function clearUpdateKey() {
  return AsyncStorage.removeItem(UpdateKey);
}

const getAppName = (update: Update) =>
  `${update.app.name}_v${update.version.split(".").join("_")}_${
    update.environment
  }_${update.channel}_${update.version_number}.apk`;

const getDownloadPath = async (update: Update) => {
  const path = RNFS.CachesDirectoryPath;
  return path + "/" + getAppName(update);
};

const getCacheDownloadDir = async () => {
  const path = RNFS.CachesDirectoryPath;
  return path + "/cache";
};

const getCacheDownloadPath = async (update: Update) => {
  return (await getCacheDownloadDir()) + "/" + getAppName(update);
};

export interface Update {
  app: {
    name: string;
    platform: "iOS" | "Android" | "Harmony";
    description: string;
    min_version: string;
    package_name: string;
  };
  need_update: boolean;
  should_update_system_version: boolean;
  in_gray_release: boolean;
  download_url: string;
  update_type: "Force" | "Silent" | "Suggestion";
  version: string;
  version_number: string;
  version_id: string;
  channel: string;
  environment: string;
  update_description: string[];
  changelog: string;
  update_method?: UpdateMethod;
}

function validateDownloadUrl(update: Update) {
  if (!update.need_update || Platform.OS === "harmony") return;

  if (typeof update.download_url !== "string" || !update.download_url.trim()) {
    throw new AppUpdateError("invalid_download_url");
  }
}

const CHANNEL_MARKET_PKG_NAME_MAP: Record<string, string> = {
  [Channel.googlePlay]: "com.android.vending",
  [Channel.huawei]: "com.huawei.appmarket",
  [Channel.xiaomi]: "com.xiaomi.market",
  [Channel.oppo]: "com.heytap.market",
  [Channel.vivo]: "com.bbk.appstore",
  [Channel.honor]: "com.hihonor.appmarket",
  [Channel.tencent]: "com.tencent.android.qqdownloader",
};

function getLocalMarketPkgName(channel: string) {
  if (channel === Channel.oppo && DeviceInfo.getApiLevelSync() < 29) {
    return "com.oppo.market";
  }
  return CHANNEL_MARKET_PKG_NAME_MAP[channel] || "";
}

function shouldTryStoreUpdate(update: Update) {
  return update.update_method === "market";
}

function buildFailureContext(
  update: Update,
  failureType: AppUpdateFailureType,
  failureReason: string,
  actualUpdatePath?: InAppUpdatePath,
): AppUpdateFailureContext {
  return {
    failureType,
    channel: update.channel || RNConfig.channel || "",
    failureReason,
    actualUpdatePath,
  };
}

function notifyUpdateFailure(
  callback: OnUpdateFailure | undefined,
  error: unknown,
  context: AppUpdateFailureContext,
) {
  try {
    callback?.(error, context);
  } catch {
    // Failure reporting must not interrupt the update flow.
    return undefined;
  }
}

function notifyStoreFailure(
  callback: DownloadCallback | undefined,
  error: unknown,
  context: AppUpdateFailureContext,
) {
  notifyUpdateFailure(callback?.onUpdateFailure, error, context);
}

async function installApk(apkPath: string) {
  try {
    await XRNAppUtils.installApp(apkPath);
  } catch (error) {
    throw new AppUpdateError("apk_install_failed", error);
  }
}

async function downloadApkFile(
  update: Update,
  downloadUrl: string,
  downloadCallback?: DownloadCallback,
) {
  try {
    const downloadPath = await getDownloadPath(update);
    if (await RNFS.exists(downloadPath)) {
      await RNFS.unlink(downloadPath);
    }
    const downloadResult = await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: downloadPath,
      background: true,
      begin: () => {
        downloadCallback?.begin?.();
      },
      progress(res) {
        const progress = (res.bytesWritten / res.contentLength) * 100;
        downloadCallback?.progressing?.(res, progress);
      },
    }).promise;
    if (downloadResult.statusCode >= 400) {
      throw new AppUpdateError(
        `apk_download_http_${downloadResult.statusCode}`,
      );
    }
    if (!(await RNFS.exists(downloadPath))) {
      throw new AppUpdateError("apk_download_failed");
    }
    return downloadPath;
  } catch (error) {
    if (error instanceof AppUpdateError) throw error;
    throw new AppUpdateError("apk_download_failed", error);
  }
}

async function copyApkToCache(downloadPath: string, cacheDownloadPath: string) {
  try {
    const cacheDownloadDir = await getCacheDownloadDir();
    const cacheDirExists = await RNFS.exists(cacheDownloadDir);
    if (!cacheDirExists) {
      // 创建缓存目录
      await RNFS.mkdir(cacheDownloadDir);
    }
    // 复制本次下载的资源到缓存目录，由于android 10+的限制，只有允许之后才能安装
    // 可以确保用户第一次下载后跳转到设置页面允许安装，之后可以直接进行安装
    await RNFS.copyFile(downloadPath, cacheDownloadPath);
  } catch (error) {
    throw new AppUpdateError("apk_cache_write_failed", error);
  }
}

async function downloadApkInApp(
  update: Update,
  actualUpdatePath: InAppUpdatePath,
  downloadUrl: string,
  downloadCallback?: DownloadCallback,
) {
  try {
    const cacheDownloadPath = await getCacheDownloadPath(update);
    const cachedApkExists = await RNFS.exists(cacheDownloadPath).catch(
      () => false,
    );
    if (cachedApkExists) {
      await installApk(cacheDownloadPath);
    } else {
      const downloadPath = await downloadApkFile(
        update,
        downloadUrl,
        downloadCallback,
      );
      await copyApkToCache(downloadPath, cacheDownloadPath);
      await installApk(downloadPath);
    }
  } catch (e) {
    const failureReason =
      e instanceof AppUpdateError ? e.failureReason : "unknown_error";
    notifyUpdateFailure(
      downloadCallback?.onUpdateFailure,
      e,
      buildFailureContext(update, "in_app", failureReason, actualUpdatePath),
    );
    downloadCallback?.error?.(e);
    return;
  }
  downloadCallback?.completed?.();
}

interface FetchQuery {
  channel?: string;
  version?: string;
  app_key?: string;
}

export async function fetchAppUpdate(query: FetchQuery = {}): Promise<Update> {
  const update = await getUpdateKey();
  const appVersion = DeviceInfo.getVersion();
  if (!isEmpty(update)) {
    if (update.currentAppVersion !== appVersion) {
      // 上传安装日志, 并清除缓存
      uploadInstallLog(update.version_id, update.currentAppVersion).then(() => {
        clearUpdateKey();
      });
    } else {
      clearUpdateKey();
    }
  }
  //获取配置
  const config = await CodePush.getConfiguration();
  const systemVersion =
    Platform.OS === "android" || Platform.OS === "harmony"
      ? String(DeviceInfo.getApiLevelSync())
      : DeviceInfo.getSystemVersion();
  const { APP_KEY, ENV_NAME, channel } = RNConfig;
  const { serverUrl, clientUniqueId } = config || {};
  const buildNumber = DeviceInfo.getBuildNumber();
  const params = new URLSearchParams({
    systemVersion: systemVersion || "",
    env: ENV_NAME || "",
    channel: channel || "",
    version: appVersion || "",
    device_id: clientUniqueId || "",
    build_number: buildNumber || "",
    app_key: APP_KEY || "",
    ...query,
  });
  const normalizedServerUrl = serverUrl?.replace(/\/+$/, "");
  return fetch(
    `${normalizedServerUrl}/xrn/app/update_check?${params.toString()}`,
    {},
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.code !== 0) {
        throw new Error(res.message);
      }
      const update = res.data as Update;
      validateDownloadUrl(update);
      return update;
    });
}

export async function uploadInstallLog(versionId: string, appVersion: string) {
  try {
    const config = await CodePush.getConfiguration();
    const { serverUrl } = config;
    const { width, height } = Dimensions.get("window");
    const device_info = JSON.stringify({
      uniqueId: await DeviceInfo.getUniqueId(),
      powerState: await DeviceInfo.getPowerState(),
      manufacturer: await DeviceInfo.getManufacturer(),
      type: DeviceInfo.getDeviceType(),
      id: DeviceInfo.getDeviceId(),
      buildNumber: DeviceInfo.getBuildNumber(),
      bundleId: DeviceInfo.getBundleId(),
    });
    const controller = new AbortController();
    const signal = controller.signal;
    return fetch(`${serverUrl}/xrn/app/log`, {
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        version_id: versionId,
        client_version: appVersion,
        device_model: DeviceInfo.getModel(),
        device_version: DeviceInfo.getSystemVersion(),
        screen_resolution: `${width}x${height}`,
        device_info,
      }),
    }).catch((error) => {
      if (error.name === "AbortError") {
        console.log("Request was canceled (detected).");
      } else {
        console.error("Request failed:", error);
      }
    });
  } catch (e) {
    console.error("uploadInstallLog error", e);
  }
}

async function openStoreByUrl(
  update: Update,
  downloadUrl: string,
  downloadCallback?: DownloadCallback,
) {
  try {
    await Linking.openURL(downloadUrl);
  } catch (error) {
    notifyStoreFailure(
      downloadCallback,
      error,
      buildFailureContext(update, "store_open", "store_open_failed"),
    );
  }
}

async function openHarmonyStore(
  update: Update,
  downloadCallback?: DownloadCallback,
) {
  try {
    await XRNAppUtils.launchAppDetail(DeviceInfo.getBundleId(), "");
  } catch (error) {
    notifyStoreFailure(
      downloadCallback,
      error,
      buildFailureContext(update, "store_open", "store_open_failed"),
    );
  }
}

async function tryOpenAndroidStore(
  update: Update,
  downloadCallback?: DownloadCallback,
): Promise<boolean> {
  const marketPkgName = getLocalMarketPkgName(
    update.channel || RNConfig.channel || "",
  );
  if (!marketPkgName) {
    const error = new AppUpdateError("market_package_not_configured");
    notifyStoreFailure(
      downloadCallback,
      error,
      buildFailureContext(update, "store_open", error.failureReason),
    );
    return false;
  }

  try {
    await XRNAppUtils.launchAppDetail(DeviceInfo.getBundleId(), marketPkgName);
    return true;
  } catch (error) {
    const errorCode = (error as { code?: string })?.code;
    const failureReason =
      errorCode && STORE_FAILURE_REASONS.has(errorCode)
        ? errorCode
        : "unknown_error";
    notifyStoreFailure(
      downloadCallback,
      error,
      buildFailureContext(update, "store_open", failureReason),
    );
    return false;
  }
}

export async function downloadAndApplyUpdate(
  update: Update,
  downloadCallback?: DownloadCallback,
) {
  const { download_url: downloadUrl } = update || {};
  setAppCacheUpdateKey(update);
  if (Platform.OS === "ios") {
    return openStoreByUrl(update, downloadUrl, downloadCallback);
  }
  if (Platform.OS === "harmony") {
    return openHarmonyStore(update, downloadCallback);
  }
  const doApkDownload = (actualUpdatePath: InAppUpdatePath) =>
    downloadApkInApp(update, actualUpdatePath, downloadUrl, downloadCallback);

  if (!shouldTryStoreUpdate(update)) {
    return doApkDownload("in_app");
  }

  const storeOpened = await tryOpenAndroidStore(update, downloadCallback);
  if (!storeOpened) {
    return doApkDownload("market_fallback_in_app");
  }
}
