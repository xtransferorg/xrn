#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(XRNAppUtilsModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// 重启App 无此实现
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(relaunchApp)

// 将App切换到后台 无此实现
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(moveTaskToBack)

// 安装App 无此实现
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(installApp)

// 是否安装了指定App，Android使用的是包名，iOS 使用的Scheme
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(isAppInstalled:(NSString *)scheme)


// 退出App
RCT_EXTERN_METHOD(exitApp:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// 是否root
RCT_EXTERN_METHOD(isAppRooted:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

// 无此实现
RCT_EXTERN_METHOD(isGooglePlayStoreInstalled:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

// 无此实现
RCT_EXTERN_METHOD(launchAppDetail:(NSString *)appPkgName marketPgkName:(NSString *)marketPgkName withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
@end
