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
#import "XTBaseBundleViewController.h"

@implementation XRNBundleModule

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
	return std::make_shared<facebook::react::NativeXRNBundleModuleSpecJSI>(params);
}

- (dispatch_queue_t)methodQueue {
	// 返回主队列，确保所有方法在主线程执行
	return dispatch_get_main_queue();
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(preLoadBundle:(NSString *)bundleName) {
	if (![XTJSBundleTool shared].preloadBundleEnabled) {
		return @(NO);
	}
	
	[[XTBundlePreloadQueue shared] enqueuePreloadTask:bundleName];
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(releaseBundle:(NSString *)bundleName) {
	
	dispatch_async(dispatch_get_main_queue(), ^{
		
		XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
		NSArray *viewControllers = nav.viewControllers;
		
		XTJSRuntimeContext *currentContext = [[XTJSBridgePool shared] fetchExistingContext:bundleName];
		
		BOOL canRelease = YES;
		for (UIViewController *vc in viewControllers) {
			if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
				XTBaseBundleViewController *baseVC = (XTBaseBundleViewController *)vc;
				if (currentContext.host && baseVC.runtimeContext.host == currentContext.host) {
					canRelease = NO;
					break;
				}
			}
		}
		
		if (canRelease && currentContext) {
			[XTMultiBundleManager.shared.pool releaseBundle:bundleName autoRelease:NO];
		}
		
	});
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(releaseBundleForce:(NSString *)bundleName) {
	[XTMultiBundleManager.shared.pool releaseBundle:bundleName autoRelease:NO];
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(preloadCommonEnabled:(BOOL)enabled) {
	[XTJSBundleTool shared].preloadCommonEnabled = enabled;
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(preloadBundleEnabled:(BOOL)enabled) {
	[XTJSBundleTool shared].preloadBundleEnabled = enabled;
  return @(YES);
}

//RCT_EXPORT_METHOD(systemMemoryWarning) {
//	[[XTJSBundleTool shared] systemMemoryWarning];
////	[[UIApplication sharedApplication] performSelector:@selector(_performMemoryWarning)];
//}
//
//RCT_EXPORT_METHOD(lruReleaseBundle) {
//	[[XTJSBundleTool shared] systemMemoryWarning];
//}
//
//RCT_EXPORT_METHOD(addMemory500MTest) {
//	[[XTJSBundleTool shared] memoryAdd];
//}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(reloadBundle) {
	
	dispatch_async(dispatch_get_main_queue(), ^{
		NSArray <XTJSRuntimeContext *>* contexts = [XTMultiBundleManager.shared.pool fetchAllRuntimeContext];
		for (XTJSRuntimeContext *context in contexts) {
			[context requestReload];
		}
	});
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(switchModule:(NSString *)bundleName moduleName:(NSString *)moduleName) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[XTNativeRouterManager.shared switchModuleWith:bundleName moduleName:moduleName];
	});
	
  return @(YES);
}

RCT_EXPORT_METHOD(getCurBundleInfo:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	resolve(@{@"":@""});
}

RCT_EXPORT_METHOD(getBundleInfo:(NSString *)bundleName
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	resolve(@{@"":@""});
}

RCT_EXPORT_METHOD(preDownloadCodePush:(NSArray *)bundleNames
									resolve:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	if ([NSThread isMainThread]) {
		[[XTJSBundleTool shared] batchPreDownload:bundleNames];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[[XTJSBundleTool shared] batchPreDownload:bundleNames];
		});
	}
	
	resolve(@(YES));
}

RCT_EXPORT_METHOD(reportCodePushProgressShown:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	// iOS 侧热更进度展示上报由 XRNPerformance 模块统一处理，此处仅完成桥接契约
	resolve(nil);
}

RCT_EXPORT_METHOD(getBundleList:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	NSArray *list = [[XTJSBundleTool shared] getBundleList];
	resolve(list);
}

/// JS获取Native codepush 信息
/// - Parameter reject: reject description
RCT_EXPORT_METHOD(getAllBundleInfos:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
	NSDictionary *codepushBundleInfos = [[XTJSBundleTool shared] getCodePushBundleInfos];
	resolve(codepushBundleInfos);
}

RCT_EXPORT_METHOD(getCurrentModuleInfo:(RCTPromiseResolveBlock)resolve
									reject:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *mutDic = [NSMutableDictionary dictionary];
  XTJSRuntimeContext *currentContext = [[XTJSBundleTool shared] fetchCurrentContext];
  NSString *currentMudule = [[XTJSBundleTool shared] fetchCurrentModuleName];
  
  if (currentContext.jsBundleName) {
	[mutDic setObject:currentContext.jsBundleName forKey:@"bundleName"];
  }
  
  if (currentMudule) {
	[mutDic setObject:currentMudule forKey:@"moduleName"];
  }
  
  resolve(mutDic);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(releaseAllBundle:(JS::NativeXRNBundleModule::ReleaseAllBundleOptions &)options) {
	NSArray <XTJSRuntimeContext *> *contexts = [XTMultiBundleManager.shared.pool fetchAllRuntimeContext];
	auto excludeBundlesOptional = options.excludeBundles();
	NSMutableSet<NSString *> *excludeBundleSet = [NSMutableSet set];
	if (excludeBundlesOptional.has_value()) {
		for (id bundleNameValue : excludeBundlesOptional.value()) {
			NSString *bundleName = (NSString *)bundleNameValue;
			if ([bundleName isKindOfClass:NSString.class]) {
				[excludeBundleSet addObject:bundleName];
			}
		}
	}
	
	for (XTJSRuntimeContext *context in contexts) {
		if (![excludeBundleSet containsObject:context.jsBundleName]) {
			[self releaseBundleForce:context.jsBundleName];
		}
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(reloadBundleByName:(NSString *)bundleName) {
	
	dispatch_async(dispatch_get_main_queue(), ^{
		
		XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
		NSArray *viewControllers = nav.viewControllers;
		
		XTJSRuntimeContext *currentContext = [[XTJSBridgePool shared] fetchExistingContext:bundleName];
		
		BOOL canReload = YES;
		for (UIViewController *vc in viewControllers) {
			if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
				XTBaseBundleViewController *baseVC = (XTBaseBundleViewController *)vc;
				if (currentContext.host && baseVC.runtimeContext.host == currentContext.host) {
					canReload = NO;
					break;
				}
			}
		}
		
		CPLog(@"canReload：%@, currentContext:%@", @(canReload), currentContext);
		if (canReload && currentContext && [currentContext.jsBundleName isEqualToString:bundleName]) {
			[currentContext requestReload];
		} else {
			CPLog(@"canReload：无可释放的bundle，引用计数不为0");
		}
	});
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(reloadBundleForceByName:(NSString *)bundleName) {
	dispatch_async(dispatch_get_main_queue(), ^{
		NSArray <XTJSRuntimeContext *>* contexts = [XTMultiBundleManager.shared.pool fetchAllRuntimeContext];

		for (XTJSRuntimeContext *context in contexts) {
			if ([context.jsBundleName isEqualToString:bundleName]) {
				[context requestReload];
			}
		}
	});

	return @(YES);
}

@end
