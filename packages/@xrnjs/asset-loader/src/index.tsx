import type { AssetData as PackagerAsset } from "metro";
import _ from "lodash";
import { PixelRatio, Platform } from "react-native";
import type { ResolvedAssetSource } from "react-native/Libraries/Image/AssetSourceResolver";
import { pickScale } from "react-native/Libraries/Image/AssetUtils";
import { requireNativeModule } from "@xrnjs/modules-core";

import { AssetSourceResolver } from "./AssetSourceResolver";
import { Spec } from "./NativeXRNAssetLoaderModule";

const {
  getAndroidResourceFolderName,
  getAndroidResourceIdentifier,
  getBasePath,
} = require("@react-native/assets-registry/path-support");
const CodePush = require("@xrnjs/react-native-code-push");

interface IAssetSourceResolver {
  serverUrl: string | undefined;
  jsbundleUrl: string;
  asset: PackagerAsset;
  isLoadedFromServer(): boolean;
  defaultAsset(): ResolvedAssetSource;
  assetServerURL(): ResolvedAssetSource;
  fromSource(source: string): ResolvedAssetSource;
  assetServerURL(): ResolvedAssetSource;
  scaledAssetPath(): ResolvedAssetSource;
  scaledAssetURLNearBundle(): ResolvedAssetSource;
  resourceIdentifierWithoutScale(): ResolvedAssetSource;
  drawableFolderInBundle(): ResolvedAssetSource;
  pickScale: (scales: number[], deviceScale?: number) => number;
  isLoadedFromFileSystem: () => boolean;
  prototype: IAssetSourceResolver;
}

/**
 * Returns a path like 'drawable-mdpi/icon.png'
 */
function getAssetPathInDrawableFolder(asset: PackagerAsset): string {
  const scale = pickScale(asset.scales, PixelRatio.get());
  const drawableFolder = getAndroidResourceFolderName(asset, scale);
  const fileName = getAndroidResourceIdentifier(asset);
  return drawableFolder + "/" + fileName + "." + asset.type;
}

export function getAssetDestRelativePath(asset: ResolvedAssetSource): string {
  const fileName = getResourceIdentifier(asset);
  return `${fileName}.${asset.type}`;
}

function getResourceIdentifier(asset: ResolvedAssetSource): string {
  const folderPath = getBasePath(asset);
  return `${folderPath}/${asset.name}`;
}

function _coerceLocalScriptURL(scriptURL: string): string | null {
  if (scriptURL) {
    if (scriptURL.startsWith("assets://")) {
      // android: running from within assets, no offline path to use
      return null;
    }
    scriptURL = scriptURL.substring(0, scriptURL.lastIndexOf("/") + 1);
    if (!scriptURL.includes("://")) {
      // Add file protocol in case we have an absolute file path and not a URL.
      // This shouldn't really be necessary. scriptURL should be a URL.
      scriptURL = "file://" + scriptURL;
    }
  }
  return scriptURL;
}

const RNPAssetsLoad = requireNativeModule<
  Spec & { DefaultMainBundlePath?: string }
>("RNPAssetsLoad");


let _sourceCodeScriptURL = "";

/**
 * 获取 js bundle 所在目录路径
 */
function getSourceCodeScriptURL() {
  if (_sourceCodeScriptURL) {
    return _sourceCodeScriptURL;
  }
  // 调用Native module获取 JS bundle 路径
  // RN允许开发者在Native端自定义JS的加载路径，在JS端可以调用SourceCode.scriptURL来获取
  // 如果开发者未指定JS bundle的路径，则在离线环境下返回asset目录
  let sourceCode =
    //@ts-ignore
    global.nativeExtensions && global.nativeExtensions.SourceCode;
  if (!sourceCode) {
    // scriptURL 需要动态获取
    sourceCode = requireNativeModule<any>("SourceCode");
  }
  _sourceCodeScriptURL = sourceCode.scriptURL;
  return _sourceCodeScriptURL;
}

function getScaledAssetPath(asset: PackagerAsset): string {
  const scale = pickScale(asset.scales, PixelRatio.get());
  const scaleSuffix = scale === 1 ? "" : "@" + scale + "x";
  const assetDir = getBasePath(asset);
  return assetDir + "/" + asset.name + scaleSuffix + "." + asset.type;
}

const AssetsLoader = {
  initAssetsLoader() {
    // 创建一个只能调用一次的函数。 重复调用返回第一次调用的结果。 func 调用时，this 绑定到创建的函数，并传入对应参数。
    const initialize = _.once(this.initAssetsLoaderInner);
    initialize();
  },

  initAssetsLoaderInner() {
    let drawablePathInfos: any = [];
    if (Platform.OS === "android") {
      RNPAssetsLoad.searchDrawableFile(
        getSourceCodeScriptURL(),
        (retArray: any) => {
          drawablePathInfos = drawablePathInfos.concat(retArray);
        }
      );

      RNPAssetsLoad.searchDrawableFile(
        CodePush.getBasePackageBundlePath(),
        (retArray: any) => {
          drawablePathInfos = drawablePathInfos.concat(retArray);
        }
      );
    }
    // hook defaultAsset方法，自定义图片加载方式
    // @ts-ignore
    AssetSourceResolver.prototype.defaultAsset = _.wrap(
      AssetSourceResolver.prototype.defaultAsset,
      function (this: IAssetSourceResolver) {
        if (this.isLoadedFromServer()) {
          return this.assetServerURL();
        }
        //@ts-ignore
        if (Platform.OS === "harmony") {
          // let uri = `asset://${getAssetDestRelativePath(this.asset)}`;
          let uri = `asset://${getScaledAssetPath(this.asset).replace(/\.\.\//g, "_")}`;
          const isFileExist = CodePush.isFileExist(uri);
          if (!isFileExist) {
            uri = CodePush.getIntlResourcePath(
              getAssetDestRelativePath(this.asset)
            );
          }
          return {
            __packager_asset: this.asset.__packager_asset,
            uri,
            scale: 1,
            width: this.asset.width,
            height: this.asset.height,
            jsbundleUrl: this.jsbundleUrl,
          };
        } else if (Platform.OS === "android") {
          if (this.isLoadedFromFileSystem()) {
            const resolveAssetSource = (
              jsbundleUrl: string
            ): ResolvedAssetSource | null => {
              let resolvedAssetSource: ResolvedAssetSource | null = null;

              const path = jsbundleUrl || "file://";
              if (this.asset.type === "svg") {
                const fileName = getAndroidResourceIdentifier(this.asset);
                resolvedAssetSource = this.fromSource(
                  path + "raw/" + fileName + "." + this.asset.type
                );
              } else {
                resolvedAssetSource = this.fromSource(
                  path + getAssetPathInDrawableFolder(this.asset)
                );
              }

              // 获取JSBundle文件所在目录下的所有drawable文件路径，并判断当前图片路径是否存在
              // 如果存在，直接返回
              if (drawablePathInfos.includes(resolvedAssetSource.uri)) {
                return resolvedAssetSource;
              }
              // 判断图片资源是否存在本地文件目录
              const isFileExist = RNPAssetsLoad.isFileExist(
                resolvedAssetSource.uri
              );
              // 存在直接返回
              if (isFileExist) {
                return resolvedAssetSource;
              }

              return null;
            };

            let resolvedAssetSource = resolveAssetSource(this.jsbundleUrl);

            if (
              resolvedAssetSource === null &&
              CodePush.isAssetBundleFileExists() === false
            ) {
              // 尝试从 CodePush 的基础包路径下加载资源
              // 把基础包路径的父目录作为资源路径 file:///data/user/0/com.xxx.app/files/codepush/.../index.jsbundle -> file:///data/user/0/com.xxx.app/files/codepush/.../
              const coercedURL = _coerceLocalScriptURL(
                CodePush.getBasePackageBundlePath()
              );
              if (coercedURL != null) {
                resolvedAssetSource = resolveAssetSource(coercedURL);
              }
            }

            if (resolvedAssetSource !== null) {
              return resolvedAssetSource;
            }

            // 不存在，则根据资源 Id 从apk包下的drawable目录加载
            return this.resourceIdentifierWithoutScale();
          }
          // 则根据资源 Id 从apk包下的drawable目录加载
          return this.resourceIdentifierWithoutScale();
        } else if (Platform.OS === "ios") {
          const iOSAsset = this.scaledAssetURLNearBundle();
          const isFileExist = RNPAssetsLoad.isFileExist(iOSAsset.uri);
          // console.log('isFileExist111', iOSAsset.uri);
          if (isFileExist) {
            return iOSAsset;
          }

          if (!CodePush?.isAssetBundleFileExists()) {
            const baseBundleUrl = CodePush?.getBasePackageBundlePath();
            const path = baseBundleUrl || 'file://';
            // console.log('isFileExist222', path);
            const resolvedAssetSource = this.fromSource(path + getScaledAssetPath(this.asset).replace(/\.\.\//g, '_'));
            // console.log('isFileExist333', resolvedAssetSource.uri);
            const isFileExist = RNPAssetsLoad.isFileExist(resolvedAssetSource.uri);
            if (resolvedAssetSource && isFileExist) {
              return resolvedAssetSource;
            }
          }

          {
            // 从内置包中查找图片资源
            const defaultMainBundlePath = RNPAssetsLoad?.getConstants?.()?.DefaultMainBundlePath ?? RNPAssetsLoad?.DefaultMainBundlePath;
            const oriJsBundleUrl = `file://${defaultMainBundlePath}/`;
            iOSAsset.uri = iOSAsset.uri.replace(
              this.jsbundleUrl,
              oriJsBundleUrl
            );
            // console.log('isFileExist444', iOSAsset.uri);
            return iOSAsset;
          }
        }
      }
    );
  },

  getSourceCodeScriptURL,
};

export { AssetsLoader };
