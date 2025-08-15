//
//  XRNBundleModule.m
//  react-native-xrn-bundle
//
//  Created by  xtgq on 2025/5/14.
//

#import "XRNBundleModule.h"
#import <React/RCTReloadCommand.h>
#import <React/RCTBridge+Private.h>
#import "XTNativeRouterManager.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <CodePush/CodePush.h>
#import "XTJSBundleTool.h"
#import "CodePush+XTBundleInfo.h"

@implementation XRNBundleModule

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(preLoadBundle:(NSString *)bundleName) {
  [XTMultiBundleManager.shared.pool preLoadBundle:bundleName];
}

RCT_EXPORT_METHOD(reloadBundle) {
  NSArray <RCTBridge *>* bridges = [XTMultiBundleManager.shared.pool fetchAllJSBridge];
  for (RCTBridge *bridge in bridges) {
	if ([bridge conformsToProtocol:@protocol(RCTReloadListener)]) {
		id <RCTReloadListener>listener =(id <RCTReloadListener>)bridge;
		[listener didReceiveReloadCommand];
	}
  }
}

RCT_EXPORT_METHOD(switchModule:(NSString *)bundleName moduleName:(NSString *)moduleName) {
  [XTNativeRouterManager.shared switchModuleWith:bundleName moduleName:moduleName];
}


RCT_EXPORT_METHOD(getCurBundleInfo:(RCTPromiseResolveBlock)resolve
				  rejecter:(RCTPromiseRejectBlock)reject)
{
	resolve(@{@"":@""});
}

RCT_EXPORT_METHOD(getBundleInfo:(NSString *)bundleName
				  resolver:(RCTPromiseResolveBlock)resolve
				  rejecter:(RCTPromiseRejectBlock)reject)
{
	resolve(@{@"":@""});
}

RCT_EXPORT_METHOD(getBundleList:(RCTPromiseResolveBlock)resolve
				  rejecter:(RCTPromiseRejectBlock)reject)
{
	NSArray *bundleList = [[XTJSBundleTool shared] getAllBundleInfo];
	resolve(bundleList);
}

/// JS获取Native侧bundle信息
/// - Parameter reject: reject description
RCT_EXPORT_METHOD(getAllBundleInfos:(RCTPromiseResolveBlock)resolve
				  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *metaData = [[NSMutableDictionary alloc] init];
  NSMutableArray *bundleInfoList = [[NSMutableArray alloc] init];
  NSArray *developmentKeyList = [[XTJSBundleTool shared] getAllDevelopmentKey];
  for (NSDictionary *item in developmentKeyList) {
	NSString *bundleName = item[@"bundleName"];
	NSString *deploymentKey = item[@"deploymentKey"];
	NSError *error;
	BOOL currentUpdateIsPending = false;
	
	NSDictionary *currentPackage = [CodePush getPackageForDeploymentKey:deploymentKey error:&error];
	currentPackage = currentPackage ?: @{};
	if (deploymentKey && deploymentKey.length > 0) {
	  NSString *packageHash = currentPackage[@"packageHash"];
	  currentUpdateIsPending = [self isPendingUpdate:packageHash deploymentKey:deploymentKey];
	}
	
	NSDictionary *resultInfo = currentPackage;
	if (currentUpdateIsPending) {
	  NSError *error;
	  resultInfo = [CodePush getPreviousPackageForDeploymentKey:deploymentKey error:&error];
	  resultInfo = resultInfo ?: @{};
	}
	
	NSMutableDictionary *dic = [[NSMutableDictionary alloc] init];
	[dic setObject:resultInfo forKey:@"codePushPackage"];
	[dic setObject:bundleName forKey:@"bundleName"];
	[bundleInfoList addObject:dic];
  }
  [metaData setObject:bundleInfoList forKey:@"bundleInfoList"];
	resolve(metaData);
  
  // NSError *error;
  // NSString *jsonString = @"";
  // NSData *jsonData = [NSJSONSerialization dataWithJSONObject:metaData options:NSJSONWritingPrettyPrinted error:&error];
  // if (!jsonData) {
	//   NSLog(@"转换为JSON时出错：%@", error);
  // } else {
	//   jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
	//   NSLog(@"JSON字符串：%@", jsonString);
  // }
  // resolve(jsonString);
}

RCT_EXPORT_METHOD(getCurrentModuleInfo:(RCTPromiseResolveBlock)resolve
				  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *mutDic = [NSMutableDictionary dictionary];
  RCTBridge *currentBridge = [[XTJSBundleTool shared] fetchCurrentBridge];
  NSString *currentMudule = [[XTJSBundleTool shared] fetchCurrentModuleName];
  
  if (currentBridge) {
	[mutDic setObject:currentBridge.xt_jsBundleName forKey:@"bundleName"];
  }
  
  if (currentMudule) {
	[mutDic setObject:currentMudule forKey:@"moduleName"];
  }
  
  resolve(mutDic);
}

- (BOOL)isPendingUpdate:(NSString*)packageHash deploymentKey:(NSString *)deploymentKey
{
	NSString *PendingUpdateKey = @"CODE_PUSH_PENDING_UPDATE";
	NSString *PendingUpdateIsLoadingKey = @"isLoading";
	NSString *PendingUpdateHashKey = @"hash";
	NSUserDefaults *preferences = [[NSUserDefaults alloc] initWithSuiteName:deploymentKey];
	NSDictionary *pendingUpdate = [preferences objectForKey:PendingUpdateKey];

	// If there is a pending update whose "state" isn't loading, then we consider it "pending".
	// Additionally, if a specific hash was provided, we ensure it matches that of the pending update.
	BOOL updateIsPending = pendingUpdate &&
						   [pendingUpdate[PendingUpdateIsLoadingKey] boolValue] == NO &&
						   (!packageHash || [pendingUpdate[PendingUpdateHashKey] isEqualToString:packageHash]);

	return updateIsPending;
}

@end
