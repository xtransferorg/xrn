//
//  XTJSBundleTool.m
//  xtapp
//
//  Created by  xtgq on 2024/1/13.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTJSBundleTool.h"
#import "RNCConfig.h"
#import "XTBaseBundleViewController.h"
#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"

@implementation XTJSBundleTool

+ (instancetype)shared {
    static XTJSBundleTool *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XTJSBundleTool alloc] init];
    });
    return shareInstance;
}

- (NSString *)getMainBundleName {
  NSString *mainBundleName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundleName"];
  return mainBundleName;
}

- (NSString *)getMainBundlePort {
  NSString *mainBundlePort = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundlePort"];
	return mainBundlePort;
}

- (NSString *)getCommonBundleName {
  NSString *commonBundleName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CommonBundleName"];
  return commonBundleName;
}

- (NSArray *)getAllSubBundles {
  NSBundle *mainBundle = [NSBundle mainBundle];
  NSString *plistPath = [mainBundle pathForResource:@"xtBundles" ofType:@"plist"];
  NSArray <NSDictionary <NSString *, id>*>*xtBundlesArray = [NSArray arrayWithContentsOfFile:plistPath];
  return xtBundlesArray;
}

- (NSArray *)getAllBundleInfo {
  NSMutableArray *bundles = [NSMutableArray array];
  [bundles addObject:@{@"bundleName":[self getMainBundleName], @"port":[self getMainBundlePort]}];
  NSArray *subBundles = [self getAllSubBundles];
  for (NSInteger i = 0; i < subBundles.count; i++) {
    NSDictionary *item = subBundles[i];
    [bundles addObject:@{@"bundleName":item[@"jsBundleName"], @"port":item[@"port"]}];
  }
  return bundles.copy;
}

- (NSArray *)getAllDevelopmentKey {
  NSMutableArray *bundles = [NSMutableArray array];
  NSString *deploymentKey = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CodePushDeploymentKey"];
  NSString *mainKey = [self getDevelopmentKeyWith:[self getMainBundleName] defaultDeploymentKey:deploymentKey];
  [bundles addObject:@{@"bundleName":[self getMainBundleName], @"deploymentKey":mainKey}];
  NSArray *subBundles = [self getAllSubBundles];
  for (NSInteger i = 0; i < subBundles.count; i++) {
    NSDictionary *item = subBundles[i];
    NSString *deploymentKey = [self getDevelopmentKeyWith:item[@"jsBundleName"] defaultDeploymentKey:item[@"codePushKey"]];
    [bundles addObject:@{@"bundleName":item[@"jsBundleName"], @"deploymentKey":deploymentKey}];
  }
  return bundles.copy;
}

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

- (NSString *)getDevelopmentKeyWith:(NSString *)bundleName defaultDeploymentKey:(NSString *)deploymentKey {
  NSString *codepushKey = deploymentKey;
  NSString *localCodePsuhKey = [self getLocalCodePushKey:bundleName];
	if (![self isProdEnv] && localCodePsuhKey) {
	codepushKey = localCodePsuhKey;
  }
  return codepushKey;
}

- (NSString *)getLocalCodePushKey:(NSString *)bundleName {
  NSString *key = [NSString stringWithFormat:@"%@-codepush-key", bundleName];
  NSString *localCodePsuhKey = [[NSUserDefaults standardUserDefaults] objectForKey:key];
  return localCodePsuhKey;
}

- (BOOL)isProdEnv {
  NSString *envName = [RNCConfig envFor:@"ENV_NAME"];
  return [envName isEqualToString:@"prod"];
}

@end
