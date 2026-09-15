import React from 'react';
// import env from 'react-native-config'
import { AssetsLoader } from '@xrnjs/asset-loader';
import { AppRegistry } from 'react-native';
import { initModule } from '../module';
import { RedirectPage } from '../components/RedirectPage';
import { hackAndriodFont } from '../utils/hack';
import { setupUnknownNativeCapabilityHandler, setupUnsupportedNativeCapabilityHandler } from '../utils/setupErrorUtilsGlobalHandler';
import { initNativeCapabilitySignature, NativeCapabilitySignature } from '../utils/initNativeCapabilitySignature';
import { logger } from '../utils/logger';

export interface BundleConfig {
  appName?: string;
  mainBundle?: boolean;
  dsnName?: string;
  debug?: boolean;
}

let bundleConfig: BundleConfig;

interface InitBundleConfigProps {
  appName?: string;
  /**
   * @deprecated
   */
  mainBundle?: boolean;

  /**
   * 原生能力签名
   */
  nativeCapabilitySignature?: NativeCapabilitySignature;

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
  onAppInitialized?(): void

  /**
   * 是否开启调试模式
   */
  debug?: boolean;
}


const initBundle = (bundleOptions: InitBundleConfigProps) => {
  logger.setDebug(Boolean(bundleOptions?.debug));

  AppRegistry.registerComponent('xt-app-404', () =>
    initModule({
      routers: [{ component: RedirectPage, path: 'RedirectPage' }],
    })
  );

  // 安卓字体hack，主要在小米机型
  hackAndriodFont()

  return () => {
    if (!bundleConfig) {
      try {
        bundleConfig = initBundleInternal(bundleOptions);
      } catch (error) {
        console.error('initBundle 初始化失败', error);
      }
    }
    return bundleConfig;
  };
};

function initBundleInternal(bundleOptions: InitBundleConfigProps): BundleConfig {
  const { appName, onAppInitialized, nativeCapabilitySignature } = bundleOptions;

  // 初始化原生能力签名
  if (nativeCapabilitySignature) {
    initNativeCapabilitySignature(nativeCapabilitySignature);
  } else {
    // 支持将签名注入core包
    // initNativeCapabilitySignature(require('../../../templates/native-capability-signature.json'));
  }
  setupUnsupportedNativeCapabilityHandler()
  setupUnknownNativeCapabilityHandler()
  // 图片的增量更新
  AssetsLoader.initAssetsLoader();

  onAppInitialized?.();

  (bundleOptions.registerComponents || []).forEach(({ appKey, getAppComponent }) => {
    AppRegistry.registerComponent(
      appKey,
      getAppComponent
    );
  });

  return { ...bundleOptions };
}

export { initBundle, bundleConfig, InitBundleConfigProps };
