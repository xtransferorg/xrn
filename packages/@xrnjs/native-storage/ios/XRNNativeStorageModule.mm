#import <React/RCTBridgeModule.h>

#if __has_include(<react_native_xrn_native_storage/react_native_xrn_native_storage-Swift.h>)
#import <react_native_xrn_native_storage/react_native_xrn_native_storage-Swift.h>
#else
#import "react_native_xrn_native_storage-Swift.h"
#endif

// 新架构需要的头文件
#ifdef RCT_NEW_ARCH_ENABLED
#import <XrnNativeStorageSpec/XrnNativeStorageSpec.h>
#endif

@interface XRNNativeStorageModule : NSObject <RCTBridgeModule>

@property (nonatomic, strong) XRNNativeStorageModuleImpl *impl;
@end

// 新架构：额外遵循 TurboModule 协议
#ifdef RCT_NEW_ARCH_ENABLED
@interface XRNNativeStorageModule () <NativeXRNNativeStorageModuleSpec>
@end
#endif

@implementation XRNNativeStorageModule

RCT_EXPORT_MODULE(XRNNativeStorageModule)

- (instancetype)init {
	self = [super init];
	if (self) {
		_impl = [[XRNNativeStorageModuleImpl alloc] init];
	}
	return self;
}

+ (BOOL)requiresMainQueueSetup {
	return YES;
}

// 新架构：getTurboModule 方法
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
	return std::make_shared<facebook::react::NativeXRNNativeStorageModuleSpecJSI>(params);
}
#endif

// 保留原有的方法声明
RCT_EXPORT_METHOD(getItem:(NSString *)key
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	[self.impl getItem:key resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(setItem:(NSString *)key
									value:(NSString *)value
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	[self.impl setItem:key value:value resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(removeItem:(NSString *)key
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject) {
	[self.impl removeItem:key resolve:resolve reject:reject];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getItemSync:(NSString *)key) {
	return [self.impl getItemSync:key];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(setItemSync:(NSString *)key value:(NSString *)value) {
	return [self.impl setItemSync:key value:value];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(removeItemSync:(NSString *)key) {
	return [self.impl removeItemSync:key];
}

@end
