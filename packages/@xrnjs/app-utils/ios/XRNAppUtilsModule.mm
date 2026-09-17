#import <React/RCTBridgeModule.h>

#if __has_include(<react_native_xrn_app_utils/react_native_xrn_app_utils-Swift.h>)
#import <react_native_xrn_app_utils/react_native_xrn_app_utils-Swift.h>
#else
#import "react_native_xrn_app_utils-Swift.h"
#endif

// 新架构需要的头文件
#ifdef RCT_NEW_ARCH_ENABLED
#import <XRNAppUtilsModuleSpec/XRNAppUtilsModuleSpec.h>
#endif

@interface XRNAppUtilsModule : NSObject <RCTBridgeModule>

@property (nonatomic, strong) XRNAppUtilsModuleImpl *impl;

@end

// 新架构：额外遵循 TurboModule 协议
#ifdef RCT_NEW_ARCH_ENABLED
@interface XRNAppUtilsModule () <NativeXRNAppUtilsModuleSpec>
@end

#endif

@implementation XRNAppUtilsModule

RCT_EXPORT_MODULE(XRNAppUtilsModule)

- (instancetype)init {
  self = [super init];
  if (self) {
    _impl = [[XRNAppUtilsModuleImpl alloc] init];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

// 新架构：getTurboModule 方法
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNAppUtilsModuleSpecJSI>(params);
}
#endif


// 重启App 无此实现
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(relaunchApp) {
  return @([self.impl relaunchApp]);
}

// 将App切换到后台 无此实现
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(moveTaskToBack) {
  return @([self.impl moveTaskToBack]);
}

// 安装App 无此实现
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installApp:(NSString *)filePath) {
  return @([self.impl installApp]);
}

// 是否安装了指定App，Android使用的是包名，iOS 使用的Scheme
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isAppInstalled:(NSString *)scheme) {
  return [self.impl isAppInstalled:scheme];
}

// 退出App
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(exitApp) {
  return @([self.impl exitApp]);
}

// 是否root
RCT_EXPORT_METHOD(isAppRooted:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl isAppRooted:resolve reject:reject];
}

// 无此实现
RCT_EXPORT_METHOD(isGooglePlayStoreInstalled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl isGooglePlayStoreInstalled:resolve reject:reject];
}

// 无此实现
RCT_EXPORT_METHOD(checkSysIntegrity:(NSString *)nonce resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self.impl checkSysIntegrity:nonce resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(launchAppDetail:(NSString *)appPkgName marketPgkName:(NSString *)marketPgkName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self.impl launchAppDetail:appPkgName marketPgkName:marketPgkName resolve:resolve reject:reject];
}


@end
