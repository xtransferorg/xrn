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

@implementation BundleNavigation
{
  bool hasListeners;
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

RCT_EXPORT_METHOD(goBack)  {
  [self native_goBack];
}

// JS侧控制Native侧导航控制器侧滑返回能力是否可用
RCT_EXPORT_METHOD(gestureEnabled:(BOOL)enable) {
  if (XTNativeRouterManager.shared.nav) {
    XTNativeRouterManager.shared.nav.interactivePopGestureRecognizer.enabled = enable;
  }
}

RCT_EXPORT_METHOD(navPushBundleProject:(NSString *)bundleName
                  moduleName:(NSString *)moduleName
                     message:(NSString *)message) {
  [self native_navPushBundleProject:bundleName moduleName:moduleName message:message replace:false];
}

// push 下一个vc 页面，replace当前vc
RCT_EXPORT_METHOD(navReplaceBundleProject:(NSString *)bundleName
                  moduleName:(NSString *)moduleName
                     message:(NSString *)message) {
  [self native_navPushBundleProject:bundleName moduleName:moduleName message:message replace:true];
}

RCT_EXPORT_METHOD(publishSingleBundleEvent:(NSString *)eventName params:(NSString *)params) {
  [self addEventName:eventName];
  if (hasListeners) { [self sendEventWithName:eventName body:params]; }
}

RCT_EXPORT_METHOD(publishAllBundleEvent:(NSString *)eventName params:(NSString *)params) {
  NSArray <RCTBridge *>*bridgeArray = [XTMultiBundleManager.shared.pool fetchAllJSBridge];
  for (RCTBridge *bridge in bridgeArray) {
    BundleNavigation *bundleNavigationInstance = [bridge moduleForClass:self.class];
    BOOL isBundleNavigationClass = [bundleNavigationInstance isKindOfClass:self.class];
    NSAssert(isBundleNavigationClass, @"Error: module instance is not bundle navigation!");
    if (isBundleNavigationClass) {
      [bundleNavigationInstance publishSingleBundleEvent:eventName params:params];
    }
  }
  
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
