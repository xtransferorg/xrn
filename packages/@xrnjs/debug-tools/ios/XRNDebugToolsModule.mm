#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(XRNDebugToolsModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// 清除缓存
RCT_EXTERN_METHOD(cleanAppCache:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// reloadBundle
RCT_EXTERN_METHOD(reloadBundle:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// 获取bundle信息
RCT_EXTERN_METHOD(getAllBundlesDataSync:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// nativeCrash
RCT_EXTERN_METHOD(nativeCrash:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// routeInfo
RCT_EXTERN_METHOD(routeInfo:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// toggleInspector
RCT_EXTERN_METHOD(toggleInspector:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// 获取inspector是否选中的状态，选中\未选中
RCT_EXTERN_METHOD(getInspectorIsShown:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// togglePerfMonitor
RCT_EXTERN_METHOD(togglePerfMonitor:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// 获取PerfMonitor是否选中的状态，选中\未选中
RCT_EXTERN_METHOD(getPerfMonitorIsShown:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// ping
RCT_EXTERN_METHOD(pingStart:(NSString *)host
				 withResolver:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)

// dns
RCT_EXTERN_METHOD(dnsStart:(NSString *)host
				 withResolver:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)
// 网络代理
RCT_EXTERN_METHOD(proxyInfo:(NSString *)url
				 withResolver:(RCTPromiseResolveBlock)resolve
				 withRejecter:(RCTPromiseRejectBlock)reject)


@end
