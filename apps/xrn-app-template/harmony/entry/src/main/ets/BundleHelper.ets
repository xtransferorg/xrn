import { AsyncStoragePackage } from "@react-native-oh-tpl/async-storage";
import { ClipboardPackage } from "@react-native-oh-tpl/clipboard";
import { CookiesPackage } from "@react-native-oh-tpl/cookies";
import { LottieAnimationView, LOTTIE_TYPE } from "@react-native-oh-tpl/lottie-react-native";
import { RNConfigPackage } from "@react-native-oh-tpl/react-native-config";
import { RNDeviceInfoPackage } from "@react-native-oh-tpl/react-native-device-info";
import { RNGetRandomValuesPackage } from "@react-native-oh-tpl/react-native-get-random-values";
import { RNLocalizePackage } from "@react-native-oh-tpl/react-native-localize";
import { PermissionsPackage } from "@react-native-oh-tpl/react-native-permissions";
import { SafeAreaViewPackage } from "@react-native-oh-tpl/react-native-safe-area-context";
import { SvgPackage } from "@react-native-oh-tpl/react-native-svg";
import { TouchIdPackage } from "@react-native-oh-tpl/react-native-touch-id";
import { CameraRollPackage } from "@react-native-oh-tpl/camera-roll"
import { LottieAnimationViewPackage } from "@react-native-oh-tpl/lottie-react-native/ts"
import { NetInfoPackage } from "@react-native-oh-tpl/netinfo/ts"
import { BlobUtilPackage } from "@react-native-oh-tpl/react-native-blob-util"
import { DocumentPickerPackage } from "@react-native-oh-tpl/react-native-document-picker/ts"
import { FastImagePackage } from "@react-native-oh-tpl/react-native-fast-image"
import { GestureHandlerPackage } from "@react-native-oh-tpl/react-native-gesture-handler"
import { ImagePickerViewPackage } from "@react-native-oh-tpl/react-native-image-picker"
import { ImageResizerPackage } from "@react-native-oh-tpl/react-native-image-resizer"
import { RNOrientationLockerPackage } from "@react-native-oh-tpl/react-native-orientation-locker"
import { ReanimatedPackage } from "@react-native-oh-tpl/react-native-reanimated/ts"
import { RNCVideoPackage } from "@react-native-oh-tpl/react-native-video/ts"

import { VisionCameraModulePackage } from "@react-native-oh-tpl/react-native-vision-camera"
import { PushNotificationPackage } from "@react-native-ohos/push-notification-ios"
import { FsPackage } from "@react-native-ohos/react-native-fs"
import { WebViewPackage} from '@react-native-oh-tpl/react-native-webview/ts'
import { CodePushPackage } from 'xrn-code-push'
import { RTNPdfView, PDF_VIEW_TYPE } from '@react-native-oh-tpl/react-native-pdf';
import { WebView, WEB_VIEW } from "@react-native-oh-tpl/react-native-webview"
import { RNCVideo, RNC_VIDEO_TYPE } from "@react-native-oh-tpl/react-native-video"
import { VisionCameraView } from "@react-native-oh-tpl/react-native-vision-camera";
import { XRNNativeStoragePackage } from 'xrn-native-storage'


import {
  ComponentBuilderContext,
  RNPackage,
  RNPackageContext,
  WrappedCustomRNComponentBuilder } from "@rnoh/react-native-openharmony/src/main/ets/RNOH";
import { RNInstance, RNInstanceOptions } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { BundleInfo, RNContainerOptions, XRNMultiBundlePackage } from "xrn-multi-bundle";
import { XRNLoadingPackage } from "xrn-loading";
import { SmartRefreshPackage } from "@react-native-oh-tpl/react-native-smartrefreshlayout";
import { XRNBundlePackage } from "xrn-bundle";
import { XRNNavigationPackage } from "xrn-navigation";
import { XRNAppUtilsPackage, XRNFilePackage, XRNToastPackage } from "xrn-app-utils";
import  { XRNDebugToolsPackage } from  'xrn-debug-tools';

export function getRNContainerOptions(): RNContainerOptions {
	return {
    getRNInstanceOptions: getRNInstanceOptions,
    getWrappedCustomRNComponentBuilder: getWrappedCustomRNComponentBuilder,
    onSetup: onSetup
  };
}

export function getRNInstanceOptions(bundleInfo: BundleInfo): RNInstanceOptions {
  return {
    createRNPackages: (ctx: RNPackageContext) => {
      return createRNPackages(ctx, bundleInfo)
    },
    enableNDKTextMeasuring: true, // 该项必须为true，用于开启NDK文本测算
    enableBackgroundExecutor: false,
    enableCAPIArchitecture: true, // 该项必须为true，用于开启CAPI
    arkTsComponentNames: arkTsComponentNames,
    enableDebugger: true,
    fontResourceByFontFamily: fontResourceByFontFamily
  }
}

export function getWrappedCustomRNComponentBuilder(bundleInfo: BundleInfo): WrappedCustomRNComponentBuilder | undefined {
  return wrappedCustomRNComponentBuilder
}

export function onSetup(rnInstance: RNInstance, bundleName: string): Promise<void> {

  rnInstance.subscribeToLifecycleEvents('JS_BUNDLE_EXECUTION_FINISH', (bundleInfo) => {
  })
  return Promise.resolve()
}

export function createRNPackages(ctx: RNPackageContext, bundleInfo: BundleInfo): RNPackage[] {
  return [
    new RNDeviceInfoPackage(ctx),
    new RNLocalizePackage(ctx),
    new RNGetRandomValuesPackage(ctx),
    new FsPackage(ctx),
    new GestureHandlerPackage(ctx),
    new SvgPackage(ctx),
    new WebViewPackage(ctx),
    new TouchIdPackage(ctx),
    new PermissionsPackage(ctx),
    new CookiesPackage(ctx),
    new LottieAnimationViewPackage(ctx),
    new RNConfigPackage(ctx),
    new SafeAreaViewPackage(ctx),
    new AsyncStoragePackage(ctx),
    new ClipboardPackage(ctx),
    // new GeneratedPackage(ctx),
    new CameraRollPackage(ctx),
    new NetInfoPackage(ctx),
    new PushNotificationPackage(ctx),
    new BlobUtilPackage(ctx),
    new DocumentPickerPackage(ctx),
    new FastImagePackage(ctx),
    new ImagePickerViewPackage(ctx),
    new ImageResizerPackage(ctx),
    new RNOrientationLockerPackage(ctx),
    new ReanimatedPackage(ctx),
    new RNCVideoPackage(ctx),
    new VisionCameraModulePackage(ctx),
    new CodePushPackage(ctx, bundleInfo, ""),
    new XRNLoadingPackage(ctx),
    new SmartRefreshPackage(ctx),
    new XRNMultiBundlePackage(ctx),
    new XRNBundlePackage(ctx, bundleInfo.bundleName),
    new XRNAppUtilsPackage(ctx),
    new XRNFilePackage(ctx),
    new XRNNavigationPackage(ctx),
    new XRNNativeStoragePackage(ctx),
    new XRNToastPackage(ctx),
    new XRNDebugToolsPackage(ctx, bundleInfo.bundleName),
  ]
}

@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {

  if (ctx.componentName === LOTTIE_TYPE) {
    LottieAnimationView({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag
    })
  }
  if (ctx.componentName === PDF_VIEW_TYPE) {
    RTNPdfView({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag,
    })
  }
  if (ctx.componentName === WEB_VIEW) {
    WebView({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag
    })
  }
  if (ctx.componentName === RNC_VIDEO_TYPE) {
    RNCVideo({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag
    })
  }
   if (ctx.componentName === VisionCameraView.NAME) {
       VisionCameraView({
           ctx: ctx.rnComponentContext,
           tag: ctx.tag,
         })
       }
}

const wrappedCustomRNComponentBuilder = wrapBuilder(buildCustomRNComponent)

const arkTsComponentNames: Array<string> = [
  PDF_VIEW_TYPE,
  WEB_VIEW,
  LOTTIE_TYPE,
  RNC_VIDEO_TYPE,
  VisionCameraView.NAME,
];

const fontResourceByFontFamily: Record<string, string | Resource> = {
  'anticon': $rawfile('fonts/AntDesign.ttf'),
  'Entypo': $rawfile('fonts/Entypo.ttf'),
  'EvilIcons': $rawfile('fonts/EvilIcons.ttf'),
  'Feather': $rawfile('fonts/Feather.ttf'),
  'FontAwesome': $rawfile('fonts/FontAwesome.ttf'),
  'FontAwesome5Brands-Regular': $rawfile('fonts/FontAwesome5_Brands.ttf'),
  'FontAwesome5Free-Regular': $rawfile('fonts/FontAwesome5_Regular.ttf'),
  'FontAwesome5Free-Solid': $rawfile('fonts/FontAwesome5_Solid.ttf'),
  'FontAwesome6Brands-Regular': $rawfile('fonts/FontAwesome6_Brands.ttf'),
  'FontAwesome6Free-Regular': $rawfile('fonts/FontAwesome6_Regular.ttf'),
  'FontAwesome6Free-Solid': $rawfile('fonts/FontAwesome6_Solid.ttf'),
  'Fontisto': $rawfile('fonts/Fontisto.ttf'),
  'fontcustom': $rawfile('fonts/Foundation.ttf'),
  'Ionicons': $rawfile('fonts/Ionicons.ttf'),
  'Material Design Icons': $rawfile('fonts/MaterialCommunityIcons.ttf'),
  'Material Icons': $rawfile('fonts/MaterialIcons.ttf'),
  'Octicons': $rawfile('fonts/Octicons.ttf'),
  'simple-line-icons': $rawfile('fonts/SimpleLineIcons.ttf'),
  'zocial': $rawfile('fonts/Zocial.ttf'),
  // 以下三种为外部字体，这里是举例说明，以用户实际为准
  // 'icomoon': $rawfile('fonts/icomoon.ttf'),
  // 'fontello': $rawfile('fonts/fontello.ttf'),
  // 'poppy-icon': $rawfile('fonts/test.ttf')
}