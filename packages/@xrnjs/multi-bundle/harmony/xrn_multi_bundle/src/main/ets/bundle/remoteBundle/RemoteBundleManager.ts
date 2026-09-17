import { BusinessError } from "@kit.BasicServicesKit";
import { http } from "@kit.NetworkKit";
import { JSON } from "@kit.ArkTS";
import { preferences } from '@kit.ArkData';
import { GetBundleListRequest } from "./http/entity/GetBundleListRequest";
import { RemoteBundleInfo } from "./http/entity/RemoteBundleInfo";
import { request } from "./http/HttpRequest";
import { GetBundleInfoRequest } from "./http/entity/GetBundleInfoRequest";
import { GetBundleInfoResponse } from "./http/entity/GetBundleInfoResponse";
import { GetBundleListResponse } from "./http/entity/GetBundleListResponse";
import { common } from "@kit.AbilityKit";
import { DEFAULT_HTTP_TIMEOUT } from "./Constant";

const TAG = "[RemoteBundle]"

export class RemoteBundleManagerOptions {
  serverUrl: string
  env: string
  buildType: string
}

export interface RemoteBundleManager{
  options: RemoteBundleManagerOptions;
  dataPreferences: preferences.Preferences;
  init: (context: common.Context, options: RemoteBundleManagerOptions) => void;
  getCacheBundleListKey: (options: RemoteBundleManagerOptions) => string;
  getCacheBundleList: () => Array<RemoteBundleInfo>;
  saveCacheBundleList: (bundleList: Array<RemoteBundleInfo>) => boolean;
  getBundleList: (successCallback: (bundleList: Array<RemoteBundleInfo>) => void, failCallback: (err) => void) => void;
  getBundleListOrCache: (callback: (bundleListWrapper: BundleListWrapper) => void) => void;
  getBundleListPromise: () => Promise<Array<RemoteBundleInfo>>;
  getBundleListOrCachePromise: () => Promise<BundleListWrapper>;
  getBundleInfo: (bundleName: string, successCallback: (bundleInfo: RemoteBundleInfo) => void, failCallback: (err) => void) => void;
  getBundleInfoPromise(bundleName: string): Promise<RemoteBundleInfo>;
}

export class BundleListWrapper {
  bundleList: Array<RemoteBundleInfo>;
  isCache: boolean;
}

const NAME_REMOTE_BUNDLE_PREFERENCE = "remote_bundle_preference"
const KEY_CACHE_BUNDLE_LIST = "key_dynamic_get_bundle_list"

export const REMOTE_BUNDLE_MANAGER: RemoteBundleManager = {
  options: null,
  dataPreferences: undefined,

  init(context: common.Context, options: RemoteBundleManagerOptions) {
    console.log(TAG, `init:options=${JSON.stringify(options)}`);
    let url = options?.serverUrl || ""
    if (url.slice(-1) !== '/') {
      url += '/'
    }
    options.serverUrl = url;
    REMOTE_BUNDLE_MANAGER.options = options;
    const preferenceOptions: preferences.Options = { name: NAME_REMOTE_BUNDLE_PREFERENCE };
    REMOTE_BUNDLE_MANAGER.dataPreferences = preferences.getPreferencesSync(context, preferenceOptions);
  },

  getCacheBundleList(): Array<RemoteBundleInfo> {
    const cacheBundleList = REMOTE_BUNDLE_MANAGER.dataPreferences.getSync(this.getCacheBundleListKey(REMOTE_BUNDLE_MANAGER.options), "[]") as string;
    const cache = JSON.parse(cacheBundleList) as Array<RemoteBundleInfo>;
    console.log(TAG, `getCacheBundleList:cacheBundleList=${cacheBundleList}`);
    return cache;
  },

  saveCacheBundleList(bundleList: Array<RemoteBundleInfo>): boolean {
    const bundleListStr = bundleList ? JSON.stringify(bundleList) : "[]";
    REMOTE_BUNDLE_MANAGER.dataPreferences.putSync(this.getCacheBundleListKey(REMOTE_BUNDLE_MANAGER.options), bundleListStr);
    REMOTE_BUNDLE_MANAGER.dataPreferences.flush();
    return true;
  },

  getBundleList(successCallback: (bundleList: Array<RemoteBundleInfo>) => void,
    failCallback: (err) => void) {
    try {
      const params: GetBundleListRequest = {
        env: REMOTE_BUNDLE_MANAGER.options.env,
        buildType: REMOTE_BUNDLE_MANAGER.options.buildType,
        platform: "harmony"
      };
      request({
        url: REMOTE_BUNDLE_MANAGER.options.serverUrl + "apps/getBundleList",
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json'
        },
        body: params,
        ...DEFAULT_HTTP_TIMEOUT
      }).then((responseStr: string) => {
        const obj = JSON.parse(responseStr) as GetBundleListResponse;
        successCallback?.(obj.data);
      }).catch((error) => {
        failCallback?.(error);
      });
    } catch (err) {
      console.log(TAG, `getBundleList:err=${JSON.stringify(err)}`);
      failCallback?.(err);
    }
  },

  getBundleListOrCache(callback: (bundleList: BundleListWrapper) => void) {
    REMOTE_BUNDLE_MANAGER.getBundleList((bundleList: Array<RemoteBundleInfo>) => {
      callback?.({ bundleList, isCache: false });
    }, (err) => {
      console.log(TAG, `getBundleListOrCache:err=${JSON.stringify(err)}`);
      const cacheBundleList = REMOTE_BUNDLE_MANAGER.getCacheBundleList();
      callback?.({ bundleList: cacheBundleList, isCache: true });
    });
  },

  async getBundleListPromise(): Promise<Array<RemoteBundleInfo>> {
    return new Promise((resolve, reject) => {
      REMOTE_BUNDLE_MANAGER.getBundleList((bundleList: Array<RemoteBundleInfo>) => {
        resolve(bundleList);
      }, (error) => {
        reject(error);
      });
    });
  },

  getBundleListOrCachePromise(): Promise<BundleListWrapper> {
    return new Promise((resolve, reject) => {
      REMOTE_BUNDLE_MANAGER.getBundleListOrCache((bundleListWrapper: BundleListWrapper) => {
        resolve(bundleListWrapper);
      });
    });
  },

  getBundleInfo(bundleName: string, successCallback: (bundleInfo: RemoteBundleInfo) => void,
    failCallback: (err) => void) {
    try {
      const params: GetBundleInfoRequest = {
        bundleName,
        env: REMOTE_BUNDLE_MANAGER.options.env,
        buildType: REMOTE_BUNDLE_MANAGER.options.buildType,
        platform: "harmony"
      };
      request({
        url: REMOTE_BUNDLE_MANAGER.options.serverUrl + "apps/getBundleInfo",
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json'
        },
        body: params,
        ...DEFAULT_HTTP_TIMEOUT
      }).then((responseStr: string) => {
        const obj = JSON.parse(responseStr) as GetBundleInfoResponse;
        successCallback?.(obj.data);
      }).catch((error) => {
        failCallback?.(error);
      });
    } catch (err) {
      console.log(TAG, `getBundleInfo:err=${JSON.stringify(err)}`);
      failCallback?.(err);
    }
  },

  async getBundleInfoPromise(bundleName: string): Promise<RemoteBundleInfo> {
    return new Promise((resolve, reject) => {
      this.getBundleInfo(bundleName, (bundleInfo: RemoteBundleInfo) => {
        resolve(bundleInfo);
      }, (error) => {
        reject(error);
      });
    });
  },
  getCacheBundleListKey: function (options: RemoteBundleManagerOptions): string {
    return `${KEY_CACHE_BUNDLE_LIST}-${options.env}-${options.buildType}`
  }
}

