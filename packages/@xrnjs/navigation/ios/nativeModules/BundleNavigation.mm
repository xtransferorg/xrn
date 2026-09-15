//
//  BundleNavigation.m
//  xtapp
//
//  Created by liyuan on 2023/10/16.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "BundleNavigation.h"
#import "XTNativeRouterManager.h"
#import "JSONUtils.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <XRNNavigationModuleSpec/XRNNavigationModuleSpec.h>

@interface BundleNavigation() <NativeBundleNavigationModuleSpec>

@end

@implementation BundleNavigation
{
  bool hasListeners;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeBundleNavigationModuleSpecJSI>(params);
}


RCT_EXPORT_MODULE()

static NSMutableArray <NSString *>*eventArray = nil;
// 这个方法应该只执行1次

+ (void)initialize {
  eventArray = [NSMutableArray arrayWithCapacity:10];
}

- (void)addListener:(NSString *)eventName {
  [self addEventName:eventName];
  [super addListener:eventName];
}

- (NSArray<NSString *> *)supportedEvents {
  // 其他bridge 如何
  return eventArray.copy;
}

// 在添加第一个监听函数时触发
-(void)startObserving {
    hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    hasListeners = NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(goBack)  {
	if ([NSThread isMainThread]) {
		[self native_goBack];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[self native_goBack];
		});
	}
	
  return @(YES);
}

// JS侧控制Native侧导航控制器侧滑返回能力是否可用
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(gestureEnabled:(BOOL)enable) {
	if ([NSThread isMainThread]) {
		if (XTNativeRouterManager.shared.nav) {
			XTNativeRouterManager.shared.nav.interactivePopGestureRecognizer.enabled = enable;
		}
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			if (XTNativeRouterManager.shared.nav) {
				XTNativeRouterManager.shared.nav.interactivePopGestureRecognizer.enabled = enable;
			}
		});
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(navPushBundleProject:(NSString *)bundleName
                            moduleName:(NSString *)moduleName
                                params:(NSString *)params) {
	if ([NSThread isMainThread]) {
		[self native_navPushBundleProject:bundleName moduleName:moduleName message:params replace:false];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[self native_navPushBundleProject:bundleName moduleName:moduleName message:params replace:false];
		});
	}
	
  return @(YES);
}

//// push 下一个vc 页面，replace当前vc
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(navReplaceBundleProject:(NSString *)bundleName
                               moduleName:(NSString *)moduleName
                                   params:(NSString *)params) {
	if ([NSThread isMainThread]) {
		[self native_navPushBundleProject:bundleName moduleName:moduleName message:params replace:true];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[self native_navPushBundleProject:bundleName moduleName:moduleName message:params replace:true];
		});
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(publishSingleBundleEvent:(NSString *)eventName params:(NSString *)params) {
  [self addEventName:eventName];
	if (hasListeners) {
		[self sendEventWithName:eventName body:params];
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(publishAllBundleEvent:(NSString *)eventName params:(NSString *)params) {
  NSArray <XTJSRuntimeContext *>*contexts = [XTMultiBundleManager.shared.pool fetchAllRuntimeContext];

  for (XTJSRuntimeContext *context in contexts) {
    BundleNavigation *bundleNavigationInstance = [context moduleForClass:self.class];
    BOOL isBundleNavigationClass = [bundleNavigationInstance isKindOfClass:self.class];
    NSAssert(isBundleNavigationClass, @"Error: module instance is not bundle navigation!");
    if (isBundleNavigationClass) {
      [bundleNavigationInstance publishSingleBundleEvent:eventName params:params];
    }
  }

  return @(YES);
}

- (void)addEventName:(NSString *)eventName {
  if (![eventArray containsObject:eventName]) {
    [eventArray addObject:eventName];
  }
}

- (void)native_navPushBundleProject:(NSString *)bundleName
                         moduleName:(NSString *)moduleName
                            message:(NSString *)message
                            replace:(BOOL)replace {
  NSString *defaultModuleName = [XTMultiBundleManager.shared.pool fetchDefaultModuleNameWithJSBundleName:bundleName] ?: bundleName;
  NSDictionary *params = message.length > 0 ? @{@"xtParamData": message, @"xtGlobalData": @"", @"params": message} : nil;
  
  NSDictionary *messageDic = [JSONUtils jsonStringToDictionary:message ?: @"{}"] ?: @{};
  
  id rawRouteParams = messageDic[@"initialRouteParams"];
  NSDictionary *routeParams = [rawRouteParams isKindOfClass:[NSDictionary class]] ? rawRouteParams : @{};
  BOOL pageReplace = NO;
  // 处理navigateBundle()跳转页面时,支持replaceVC，通过判断params中`_replace`的值
  if (routeParams[@"_replace"] && [routeParams[@"_replace"] isKindOfClass:[NSString class]]) {
    pageReplace = [routeParams[@"_replace"] isEqualToString:@"1"];
  }
  
  NSString *realModuleName = ((moduleName != nil) && (moduleName.length > 0)) ? moduleName : defaultModuleName;
  [XTNativeRouterManager.shared pushViewController:bundleName moduleName:realModuleName initialProperties:params replace:replace ?: pageReplace];
}

- (void)native_goBack {
  [XTNativeRouterManager.shared popViewControllerAnimated:YES];
}

- (void)popToRootViewController {
  [XTNativeRouterManager.shared popToRootViewControllerAnimated:YES];
}

@end
