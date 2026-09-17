//
//  XRNImageTuborModule.m
//  react-native-xrn-image
//
//  Created by  xtgq on 2026/3/12.
//

#import "XRNImageTuborModule.h"
#import <React/RCTBridgeModule.h>

@implementation XRNImageTuborModule

RCT_EXPORT_MODULE(XRNImageView)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
	return std::make_shared<facebook::react::NativeXRNImageModuleSpecJSI>(params);
}

RCT_EXPORT_METHOD(prefetch:(NSArray *)urls
									cachePolicy:(NSString *)cachePolicy
									headers:(JS::NativeXRNImageModule::SpecPrefetchHeaders &)headers
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	resolve(@(NO));
}

RCT_EXPORT_METHOD(clearMemoryCache:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	resolve(@(NO));
}

RCT_EXPORT_METHOD(clearDiskCache:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	resolve(@(NO));
}

RCT_EXPORT_METHOD(getCachePathAsync:(NSString *)cacheKey
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	resolve(@"/");
}

@end
