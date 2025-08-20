import { AssetsLoader } from "@xrnjs/asset-loader";
import { AppRegistry } from "react-native";
import { initModule } from "../module";
import { RedirectPage } from "../components/RedirectPage";
import { hackAndriodFont } from "../utils/hack";

interface BundleConfig {
  appName?: string;
  mainBundle?: boolean;
}

let bundleConfig: BundleConfig;

interface InitBundleConfigProps {
  appName?: string;
  /**
   * @deprecated
   */
  mainBundle?: boolean;

  /**
   *  注册RN组件
   */
  registerComponents?: {
    appKey: string;
    getAppComponent(): React.ComponentType;
  }[];

  /**
   *  项目初始化完成后的回调
   */
  onAppInitialized?(): void;
}

const initBundle = (bundleOptions: InitBundleConfigProps) => {
  AppRegistry.registerComponent("xt-app-404", () =>
    initModule({
      routers: [{ component: RedirectPage, path: "RedirectPage" }],
    })
  );

  // 安卓字体hack，主要在小米机型
  hackAndriodFont();

  return () => {
    if (!bundleConfig) {
      try {
        bundleConfig = initBundleInternal(bundleOptions);
      } catch (error) {
        console.error("initBundle 初始化失败", error);
      }
    }
    return bundleConfig;
  };
};

function initBundleInternal(
  bundleOptions: InitBundleConfigProps
): BundleConfig {
  const { onAppInitialized } = bundleOptions;

  // 图片的增量更新
  AssetsLoader.initAssetsLoader();

  onAppInitialized?.();

  (bundleOptions.registerComponents || []).forEach(
    ({ appKey, getAppComponent }) => {
      AppRegistry.registerComponent(appKey, getAppComponent);
    }
  );

  return { ...bundleOptions };
}

export { initBundle, bundleConfig, InitBundleConfigProps };
