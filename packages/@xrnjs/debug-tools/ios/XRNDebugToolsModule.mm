#import <React/RCTBridgeModule.h>

#if __has_include(<react_native_xrn_debug_tools/react_native_xrn_debug_tools-Swift.h>)
#import <react_native_xrn_debug_tools/react_native_xrn_debug_tools-Swift.h>
#else
//#import "react_native_xrn_debug_tools-Swift.h"
//#import "react_native_xrn_debug_tools-Swift.h"
#import "XRNDebugTools-Swift.h"
#endif

// 新架构需要的头文件
#ifdef RCT_NEW_ARCH_ENABLED
#import <XRNDebugToolsModuleSpec/XRNDebugToolsModuleSpec.h>
#endif

@interface XRNDebugToolsModule : NSObject <RCTBridgeModule>

@property (nonatomic, strong) XRNDebugToolsModuleImpl *impl;

@end

// 新架构：额外遵循 TurboModule 协议
#ifdef RCT_NEW_ARCH_ENABLED
@interface XRNDebugToolsModule () <NativeXRNDebugToolsModuleSpec>
@end

#endif

@implementation XRNDebugToolsModule

RCT_EXPORT_MODULE(XRNDebugToolsModule)

- (instancetype)init {
  self = [super init];
  if (self) {
    _impl = [[XRNDebugToolsModuleImpl alloc] init];
  }
  return self;
}

// 新架构：getTurboModule 方法
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNDebugToolsModuleSpecJSI>(params);
}
#endif


// + (BOOL)requiresMainQueueSetup
// {
//   return NO;
// }

// 清除缓存
RCT_EXPORT_METHOD(cleanAppCache:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl cleanAppCache:resolve reject:reject];
}

// reloadBundle
RCT_EXPORT_METHOD(reloadBundle:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl reloadBundle:resolve reject:reject];
}

// 获取bundle信息
RCT_EXPORT_METHOD(getAllBundlesDataSync:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.impl getAllBundlesDataSync:resolve reject:reject];
  });
}

// nativeCrash
RCT_EXPORT_METHOD(nativeCrash:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl nativeCrash:resolve reject:reject];
}

// routeInfo
RCT_EXPORT_METHOD(routeInfo:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl routeInfo:resolve reject:reject];
}

// toggleInspector
RCT_EXPORT_METHOD(toggleInspector:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl toggleInspector:resolve reject:reject];
}

// 获取inspector是否选中的状态，选中\未选中
RCT_EXPORT_METHOD(getInspectorIsShown:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl getInspectorIsShown:resolve reject:reject];
}

// togglePerfMonitor
RCT_EXPORT_METHOD(togglePerfMonitor:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl togglePerfMonitor:resolve reject:reject];
}

// 获取PerfMonitor是否选中的状态，选中\未选中
RCT_EXPORT_METHOD(getPerfMonitorIsShown:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl getPerfMonitorIsShown:resolve reject:reject];
}

// toggleMemoryLeak
RCT_EXPORT_METHOD(toggleMemoryLeak:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl toggleMemoryLeak:resolve reject:reject];
}

// 获取MemoryLeak是否选中的状态，选中\未选中
RCT_EXPORT_METHOD(getMemoryLeakIsShown:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl getMemoryLeakIsShown:resolve reject:reject];
}

// ping
RCT_EXPORT_METHOD(pingStart:(NSString *)host
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl pingStart:host resolve:resolve reject:reject];
}

// dns
RCT_EXPORT_METHOD(dnsStart:(NSString *)host
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl dnsStart:host resolve:resolve reject:reject];
}

// 网络代理
RCT_EXPORT_METHOD(proxyInfo:(NSString *)url
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [self.impl proxyInfo:url resolve:resolve reject:reject];
}

// bundle调试模式
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(registerDevBundle:(NSString *)bundleName port:(NSString *)port) {
  return @([self.impl registerDevBundle:bundleName portStr:port]);
}


// Android API，iOS 空实现
RCT_EXPORT_METHOD(getBundleDebugConfig:(NSString *)bundleName
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(setBundleDebugConfig:(NSString *)bundleName config:(NSDictionary *)config) {
	return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeStorageSync:(NSString *)spName key:(NSString *)key) {
  return @"";
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(setNativeStorageSync:(NSString *)spName key:(NSString *)key value:(NSString *)value) {
	return @(0);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getBundleHostIPSync) {
	return @"";
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(setBundleHostIP:(NSString *)ip) {
	return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(openConnection:(NSString *)host port:(NSString *)port room:(NSString *)room) {
	return @(YES);
}

@end
