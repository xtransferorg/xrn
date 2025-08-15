//
//  XRNNavigation.m
//  react-native-xrn-navigation
//
//  Created by  xtgq on 2025/5/14.
//

#import "XRNNavigation.h"
#import "NavigationAction.h"
#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"
#import "XTBaseBundleViewController.h"
#import "RCTBridge+XTExtension.h"

@implementation XRNNavigation
{
	bool hasListeners;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
	return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
	return YES;
}

- (NSArray<NSString *> *)supportedEvents {
	return @[
		@"NATIVE_DISPATCH_ACTION",
		@"XT_SCREEN_APPEAR",
		@"XT_SCREEN_DISAPPEAR"
	];
}

// Will be called when this module's first listener is added.
-(void)startObserving {
	hasListeners = YES;
	// Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
	hasListeners = NO;
	// Remove upstream listeners, stop unnecessary background tasks
}

/**
 存储Navigation的Key到控制器
 */
RCT_EXPORT_METHOD(setNavigationKey:(NSString *)key) {
	if (key == nil || key.length == 0) {
		return;
	}
	
	dispatch_async(dispatch_get_main_queue(), ^{
		[[NavigationAction shared] setNavigationKey:key];
	});
}

/**
 存储Navigation的state数据到控制器
 */
RCT_EXPORT_METHOD(setNavigationState:(NSString *)state) {
	if (state == nil || state.length == 0) {
		return;
	}
	
	dispatch_async(dispatch_get_main_queue(), ^{
		[[NavigationAction shared] setNavigationState:state];
	});
}

/**
 处理Navigation导航的事件
 */
RCT_EXPORT_METHOD(dispatchAction:(NSString *)action
				  resolve:(RCTPromiseResolveBlock)resolve
				  reject:(RCTPromiseRejectBlock)reject) {
	if (action == nil || action.length == 0) {
		resolve([NSNumber numberWithBool:NO]);
		return;
	}
	
	resolve([NSNumber numberWithBool:YES]);

	dispatch_async(dispatch_get_main_queue(), ^{
		[[NavigationAction shared] dispatchAction:action];
	});
}


/**
 获取当前bundle的信息
 */
RCT_EXPORT_METHOD(getCurrentModuleInfo:(RCTPromiseResolveBlock)resolve
				  reject:(RCTPromiseRejectBlock)reject) {
	NSMutableDictionary *mutDic = [NSMutableDictionary dictionary];
	RCTBridge *currentBridge = [self fetchCurrentBridge];
	NSString *currentMudule = [self fetchCurrentModuleName];
	
	[mutDic setObject:currentBridge.xt_jsBundleName ?: @"" forKey:@"bundleName"];
	[mutDic setObject:currentMudule ?: @"" forKey:@"moduleName"];
	resolve(mutDic);
}

/**
 处理AppCrash后路由恢复（二期功能）
 */
RCT_EXPORT_METHOD(beforeAppCrash) {
	
}

/**
 处理App异常（二期功能）
 */
RCT_EXPORT_METHOD(throwException) {
	
}

// 获取当前的bridge
- (RCTBridge *)fetchCurrentBridge {
	RCTBridge *currentBridge = nil;
	
	XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
	UIViewController *topStackVC = nav.viewControllers.lastObject;
	
	if ([topStackVC isKindOfClass:[XTBaseBundleViewController class]]) {
		XTBaseBundleViewController *bundleVC = (XTBaseBundleViewController *)topStackVC;
		currentBridge = bundleVC.bridge;
	}
	return currentBridge;
}

// 获取当前的module
- (NSString *)fetchCurrentModuleName {
	NSString *currentModule = nil;
	
	XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
	UIViewController *topStackVC = nav.viewControllers.lastObject;
	
	if ([topStackVC isKindOfClass:[XTBaseBundleViewController class]]) {
		XTBaseBundleViewController *bundleVC = (XTBaseBundleViewController *)topStackVC;
		currentModule = bundleVC.moduleName;
	}
	return currentModule;
}

- (void)sendCustomEvent:(NSString *)eventName data:(NSString *)dataStr {
	if (hasListeners && [self.supportedEvents containsObject:eventName]) {
		[self sendEventWithName:eventName body:dataStr];
	}
}

@end
