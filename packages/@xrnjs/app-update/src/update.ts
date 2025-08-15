import AsyncStorage from "@react-native-async-storage/async-storage";
import { isEmpty } from "lodash";
import { Dimensions, Linking } from "react-native";
import CodePush from "@xrnjs/react-native-code-push";
import RNConfig from "react-native-config";
import DeviceInfo from "react-native-device-info";
import RNFS from "react-native-fs";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { Platform } from "@xrnjs/modules-core";
import { Toast } from "@xrnjs/ui";

const UpdateKey = "xrn-app-update-internal";

export enum Channel {
  googlePlay = "googlePlay",
  appGallery = "AppGallery",
  huawei = "huawei",
  xiaomi = "xiaomi",
  oppo = "oppo",
  vivo = "vivo",
  honor = "honor",
}

function setAppCacheUpdateKey(update: Update) {
  const appVersion = DeviceInfo.getVersion();
  return AsyncStorage.setItem(
    UpdateKey,
    JSON.stringify(
      Object.assign(update, {
        currentAppVersion: appVersion,
      })
    )
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
  `${update.app.name}_v${update.version.split(".").join("_")}_${update.environment}_${update.channel}_${update.version_number}.apk`;

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
}

export async function fetchAppUpdate(): Promise<Update> {
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
  const config = await CodePush.getConfiguration();
  const systemVersion =
    Platform.OS === "android" || Platform.OS === "harmony"
      ? String(DeviceInfo.getApiLevelSync())
      : DeviceInfo.getSystemVersion();
  const { APP_KEY, ENV_NAME, channel } = RNConfig;
  const { serverUrl, clientUniqueId } = (config || {}) as any;
  const buildNumber = DeviceInfo.getBuildNumber();
  const params = new URLSearchParams({
    systemVersion: systemVersion || "",
    env: ENV_NAME || "",
    channel: channel || "",
    version: appVersion || "",
    device_id: clientUniqueId || "",
    build_number: buildNumber || "",
    app_key: APP_KEY || "",
  });
  return fetch(`${serverUrl}/xrn/app/update_check?${params.toString()}`, {})
    .then((res) => res.json())
    .then((res) => {
      if (res.code !== 0) {
        throw new Error(res.message);
      }
      return res.data;
    });
}

export function openGooglePlayUrlByWeb() {
  const pkgName = DeviceInfo.getBundleId();
  const url = `https://play.google.com/store/apps/details?id=${pkgName}&pcampaignid=web_share`;
  return Linking.openURL(url);
}

export async function downloadAppWithGooglePlay() {
  if (typeof XRNAppUtils?.launchAppDetail !== "function") {
    return openGooglePlayUrlByWeb();
  }

  const pkgName = DeviceInfo.getBundleId();

  return XRNAppUtils.launchAppDetail(pkgName, "com.android.vending").catch(
    () => {
      // 执行失败去网页
      return openGooglePlayUrlByWeb();
    }
  );
}

function openChannelAppDetail(
  storePkgName: string,
  schemeUri: string,
  uri: string,
  onOpenStoreError?: any
) {
  const pkgName = DeviceInfo.getBundleId();
  function open() {
    return Linking.openURL(schemeUri + pkgName).catch(() => {
      console.log(
        `Failed to open app store with scheme URI: ${schemeUri + pkgName}`
      );
      // 如果应用商店打开失败，尝试使用scheme URI
      return Linking.openURL(uri + pkgName).catch((error) => {
        console.log(
          `Failed to open app store with URI: ${uri + pkgName}`,
          error
        );
        return Linking.openURL("market://app_details?id=" + pkgName).catch(
          () => {
            Toast(
              "The app store cannot be opened. Please check if the corresponding app store has been installed."
            );
            onOpenStoreError?.(error);
          }
        );
      });
    });
  }
  if (XRNAppUtils.isAppInstalled(storePkgName)) {
    console.log(
      `App store ${storePkgName} is installed, launching app detail page.`
    );
    return XRNAppUtils.launchAppDetail(pkgName, storePkgName).catch(() => {
      return open();
    });
  } else {
    console.log(
      `App store ${storePkgName} is not installed, opening app detail page in browser.`
    );
    return open();
  }
}

export async function downloadAPPWithHarmony() {
  const pkgName = DeviceInfo.getBundleId();
  return XRNAppUtils.launchAppDetail(pkgName, "");
}

export async function downloadAPPWithXiaomi(onOpenStoreError) {
  return openChannelAppDetail(
    "com.xiaomi.market",
    "market://details?id=",
    "https://app.mi.com/details?id=",
    onOpenStoreError
  );
}

export async function downloadAPPWithHuawei(onOpenStoreError) {
  return openChannelAppDetail(
    "com.huawei.appmarket",
    "appmarket://details?id=",
    "https://appgallery.huawei.com/#/app/",
    onOpenStoreError
  );
}

export async function downloadAPPWithOppo(onOpenStoreError) {
  return openChannelAppDetail(
    "com.oppo.market",
    "oppomarket://details?packagename=",
    "https://oppomobile.com/apps/",
    onOpenStoreError
  );
}

export async function downloadAPPWithVivo(onOpenStoreError) {
  return openChannelAppDetail(
    "com.bbk.appstore",
    "vivomarket://details?id=",
    "https://info.appstore.vivo.com.cn/detail/",
    onOpenStoreError
  );
}

export async function downloadAPPWithHonor(error) {
  return openChannelAppDetail(
    "com.hihonor.appmarket",
    "honormarket://details?id=",
    "market://app_details?id=",
    error
  );
}

export async function uploadInstallLog(versionId: string, appVersion: string) {
  try {
    const config = await CodePush.getConfiguration();
    const { serverUrl } = config as any;
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

export function enableStoreUpdate() {
  if (Platform.OS === "ios") {
    return false;
  }
  const supportedChannels = [
    Channel.googlePlay,
    Channel.appGallery,
    Channel.huawei,
    Channel.xiaomi,
    Channel.oppo,
    Channel.vivo,
    Channel.honor,
  ];
  if (supportedChannels.includes(RNConfig.channel as Channel)) {
    return false;
  }
  return true;
}

export async function downloadAndApplyUpdate(
  update: Update,
  downloadCallback?: {
    begin?: () => void;
    progressing?: (
      res: { bytesWritten: number; contentLength: number },
      progress: number
    ) => void;
    completed?: () => void;
    error?: (e: any) => void;
    onOpenStoreError?: (e: any) => void;
  }
) {
  const { download_url: downloadUrl } = update || {};
  const { onOpenStoreError } = downloadCallback || {};
  setAppCacheUpdateKey(update);
  if (Platform.OS === "ios") {
    return Linking.openURL(downloadUrl);
  }
  switch (RNConfig.channel) {
    case Channel.googlePlay:
      return downloadAppWithGooglePlay();
    case Channel.appGallery:
      return downloadAPPWithHarmony();
    case Channel.huawei:
      return downloadAPPWithHuawei(onOpenStoreError);
    case Channel.xiaomi:
      return downloadAPPWithXiaomi(onOpenStoreError);
    case Channel.oppo:
      return downloadAPPWithOppo(onOpenStoreError);
    case Channel.vivo:
      return downloadAPPWithVivo(onOpenStoreError);
    case Channel.honor:
      return downloadAPPWithHonor(onOpenStoreError);
  }

  const { begin, progressing, completed, error } = downloadCallback || {};
  try {
    const cacheDownloadPath = await getCacheDownloadPath(update);
    const apkFileExist = await RNFS.exists(cacheDownloadPath);
    if (apkFileExist) {
      console.log("APK file already exists in cache:", cacheDownloadPath);
      // 如果已经下载过了，直接安装
      await XRNAppUtils.installApp(cacheDownloadPath);
      completed?.();
      return;
    }
    const downloadPath = await getDownloadPath(update);
    await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: downloadPath,
      background: true,
      begin: () => {
        begin?.();
      },
      progress(res) {
        const progress = (res.bytesWritten / res.contentLength) * 100;
        progressing?.(res, progress);
      },
    }).promise;
    console.log("Download completed:", downloadPath);
    const cacheDownloadDir = await getCacheDownloadDir();
    const cacheDirExists = await RNFS.exists(cacheDownloadDir);
    if (!cacheDirExists) {
      // 创建缓存目录
      await RNFS.mkdir(cacheDownloadDir);
    }
    console.log("Cache download path:", cacheDownloadPath);
    // 复制本次下载的资源到缓存目录，由于android 10+的限制，只有允许之后才能安装
    // 可以确保用户第一次下载后跳转到设置页面允许安装，之后可以直接进行安装
    await RNFS.copyFile(downloadPath, cacheDownloadPath);
    console.log("Copied to cache download path:", cacheDownloadPath);
    // 安装
    await XRNAppUtils.installApp(downloadPath);
    console.log("Installation completed.");
    completed?.();
  } catch (e) {
    error?.(e);
  }
}
