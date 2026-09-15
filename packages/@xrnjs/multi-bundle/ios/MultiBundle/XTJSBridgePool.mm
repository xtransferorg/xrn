//
//  XTJSBridgePool.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBridgePool.h"
#import "XTJSRuntimeContext.h"
#import "XTJSBundleModel.h"
#import "XTBundleData.h"
#import "XTJSBridgeDelegation.h"
#import <YYCache/YYMemoryCache.h>
#import "XTMultiBundleManager.h"
#import <mach/mach.h>

#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHermesInstance.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@interface XTJSBridgePool ()

@property (nonatomic, strong) XTJSRuntimeContext *mainContext;
@property (nonatomic, strong) XTJSBundleModel *mainBundleModel;
@property (nonatomic, strong) NSHashTable <XTJSRuntimeContext *>*weakHashTable;
@property (nonatomic, strong) YYMemoryCache *cache;

@property (nonatomic, strong) NSMutableArray <XTJSBundleModel *>*bundleModelArray;
@property (nonatomic, strong) NSMutableArray <NSString *>*forceCacheCommon;
@end

@implementation XTJSBridgePool

extern "C" void CPLog2(NSString *formatString, ...) {
	NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
	[formatter setDateFormat:@"HH:mm:ss.SSS"];
	NSString *timeString = [formatter stringFromDate:[NSDate date]];

	va_list args;
	va_start(args, formatString);
	NSString *prependedFormatString = [NSString stringWithFormat:@"\n[%@] [CodePush] %@", timeString, formatString];
	NSLogv(prependedFormatString, args);
	va_end(args);
}

+ (instancetype)shared {
	static XTJSBridgePool *shareInstance;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		shareInstance = [[XTJSBridgePool alloc] init];
		YYMemoryCache *cache = [[YYMemoryCache alloc] init];
		cache.name = @"XTJSRuntimeContext缓存";
		// cache.countLimit = 20;
		cache.shouldRemoveAllObjectsWhenEnteringBackground = NO;
		cache.didReceiveMemoryWarningBlock = ^(YYMemoryCache * _Nonnull cache) {
			NSLog(@"didReceiveMemoryWarningBlock：%@", cache);
		};
		cache.didEnterBackgroundBlock = ^(YYMemoryCache * _Nonnull cache) {
			NSLog(@"didEnterBackgroundBlock：%@", cache);
		};
		
		shareInstance.cache = cache;
		
		shareInstance.bundleModelArray = [NSMutableArray array];
		shareInstance.forceCacheCommon = [NSMutableArray array];
		shareInstance.weakHashTable = [NSHashTable weakObjectsHashTable];
	});
	return shareInstance;
}

// 这里更多是初始化bundle的数据模型列表，预缓存逻辑需要改造
- (void)setupAllJSBridgeInfo:(NSArray <XTBundleData *>*)bundleArray launchOptions:(NSDictionary *)launchOptions {
	
	// 这里的bundleModelArray 含有mainBundle 和 所有subBundle
	NSMutableArray <XTJSBundleModel *>*bundleModelArray = [NSMutableArray array];
	
	for (NSInteger i = 0; i < bundleArray.count; i++) {
		// bundelData
		XTBundleData *bundleData = bundleArray[i];
		
		// 根据bundleData创建delegation
		XTJSBridgeDelegation *bridgeDelegation = [[XTJSBridgeDelegation alloc] initWithBundleData:bundleData];
		
		// 根据delegation创建bundleModel
		XTJSBundleModel *bundleModel = [[XTJSBundleModel alloc] initWithJSBundleName:bundleData.jsBundleName moduleName:bundleData.moduleName codePushKey:bundleData.codePushKey portNum:bundleData.portNum isMain:bundleData.isMain isPreLoaded:NO bindTargetBundleName:@"" delegation:bridgeDelegation];
		
		[bundleModelArray addObject:bundleModel];
	}
	
	NSMutableArray <XTJSBundleModel *>*modelArray = bundleModelArray;
	
	NSInteger NoExistIndex = -1;
	NSInteger mainBundleIndex = NoExistIndex;
	for (NSInteger i = 0; i < modelArray.count; i++) {
		XTJSBundleModel *bundleModel = modelArray[i];
		if (bundleModel.isMain) {
			if (mainBundleIndex == NoExistIndex) {
				mainBundleIndex = i;
			} else {
				NSAssert(NO, @"MultiBundle find main bundle more than one");
			}
		}
	}
	
	if (mainBundleIndex == NoExistIndex) {
		NSAssert(mainBundleIndex > NoExistIndex, @"MultiBundle can't find main bundle");
	}
	
	self.mainBundleModel = modelArray[mainBundleIndex];
	
	// 提前加载mainBundle Bridge
	[self loadMainBridgeWithLaunchOptions:launchOptions];
	
	// 此时modelArray只有所有子bundle的数据信息
	[modelArray removeObjectAtIndex:mainBundleIndex];
	
	CPLog2(@"bundleModelArray：%@", bundleModelArray);
	
	self.bundleModelArray = modelArray;
	
}

- (XTJSRuntimeContext *)fetchContextWithJSBundleName:(NSString *)jsbundleName {
	XTJSRuntimeContext *context = [self getRuntimeContext:jsbundleName isPreLoadBiz:NO];
	return context;
}

- (void)preLoadBundle:(NSString *)bundleName {
	CPLog2(@"预加载biz 入口：------------");

	XTJSRuntimeContext *context = [self getRuntimeContext:bundleName isPreLoadBiz:YES];
	[context setPreloadBizMode:YES];
	CPLog2(@"预加载 biz bundle 流程结束，使用的 context : %@", context);
}

- (void)startPreloadCommon {
	CPLog2(@"预加载Common 入口：------------");
	
	for (XTJSBundleModel *bundleModel in self.bundleModelArray) {
		if (!bundleModel.isPreLoaded && bundleModel.bindTargetBundleName.length < 1 && [bundleModel.moduleName hasPrefix:@"preload"]) {
			[self preLoadCommonBundle:bundleModel.jsBundleName];
			return;
		}
	}
	
}

- (void)preLoadCommonBundle:(NSString *)bundleName {
	if (bundleName.length == 0) {
		return;
	}
	if ([self.forceCacheCommon containsObject:bundleName]) {
		return;
	}

	XTJSRuntimeContext *context = [self getRuntimeContext:bundleName isPreLoadBiz:NO];
	if (!context) {
		return;
	}
	[context setPreloadCommonMode:YES];
	[self.forceCacheCommon addObject:bundleName];
}

- (void)loadMainBridgeWithLaunchOptions:(NSDictionary *)launchOption {
	NSMutableDictionary *newlaunchOption = [NSMutableDictionary dictionaryWithDictionary:launchOption];
  // 1. 先建 Context
	XTJSRuntimeContext *context = [[XTJSRuntimeContext alloc] init];
	context.launchOptions = newlaunchOption;
	context.jsBundleName = self.mainBundleModel.jsBundleName;
	context.originalJsBundleName = self.mainBundleModel.jsBundleName;
	context.isMain = self.mainBundleModel.isMain;
	context.lastAccessTimestampMs = XT_RUNTIME_CURRENT_TIMESTAMP_MS;
  
  // 2. 注入 Delegation，Provider 解析 URL 时能写到 context
	self.mainBundleModel.delegation.runtimeContext = context;
	XTJSBridgePool.shared.mainContext = context;

  // 3. 再建 Host（对标 initWithDelegate + attachFabric）
	RCTHost *host = [self createAndStartHostWithDelegation:self.mainBundleModel.delegation
	                                         launchOptions:newlaunchOption];
	context.host = host;
}

- (XTJSRuntimeContext *)getRuntimeContext:(NSString *)jsbundleName isPreLoadBiz:(BOOL)isPreLoadBiz {
	NSString *mainBundleName = self.mainBundleModel.jsBundleName;
	if ([jsbundleName isEqualToString:mainBundleName]) {
		return self.mainContext;
	}

  if ([jsbundleName hasPrefix:@"preload"]) {
    CPLog2(@"common bundle 预加载 流程开始 --------------------------");
  } else if (isPreLoadBiz) {
    CPLog2(@"biz bundle 预加载 流程开始 --------------------------");
  } else {
    CPLog2(@"子bundle 跨bundle跳转流程开始 --------------------------");
  }
  
  CPLog2(@"targetBundleName：%@", jsbundleName);

	BOOL isPreloadCommon = [jsbundleName hasPrefix:@"preload"];

	XTJSBundleModel *currentModel;
	if (isPreloadCommon) {
		for (XTJSBundleModel *model in self.bundleModelArray) {
			if ([model.jsBundleName isEqualToString:jsbundleName] && [model.moduleName hasPrefix:@"preload"]) {
				currentModel = model;
				break;
			}
		}
	} else {
		for (XTJSBundleModel *model in self.bundleModelArray) {
			if ([model.jsBundleName isEqualToString:jsbundleName] && ![model.moduleName hasPrefix:@"preload"]) {
				currentModel = model;
				break;
			}
		}
	}

	if (!currentModel && [self isDynamicBundle:jsbundleName]) {
		currentModel = [self createDynamicBundleModel:jsbundleName];
	}

	if (currentModel == nil) {
		return nil;
	}

	XTJSRuntimeContext *cacheContext = [self.cache objectForKey:currentModel];

	if (!cacheContext && !isPreloadCommon) {
		XTJSRuntimeContext *reused = [self setupPreloadCommonHost:currentModel isPreLoadBiz:isPreLoadBiz];
		if (reused) {
			return reused;
		}
	}

	if (!cacheContext) {
		XTJSRuntimeContext *newContext = [self loadContextToCache:currentModel isPreloadCommon:isPreloadCommon isPreloadBiz:isPreLoadBiz];
		return newContext;
	}

	return cacheContext;
}

- (XTJSRuntimeContext *)fetchMainContext {
	return self.mainContext;
}

- (XTJSRuntimeContext *)fetchExistingContext:(NSString *)bundleName {
	NSString *mainBundleName = self.mainBundleModel.jsBundleName;
	if ([bundleName isEqualToString:mainBundleName]) {
		return self.mainContext;
	}

	for (XTJSBundleModel *targetModel in self.bundleModelArray) {
		if (![targetModel.jsBundleName isEqualToString:bundleName]) {
			continue;
		}
		XTJSRuntimeContext *targetContext = [self.cache objectForKey:targetModel];
		if (targetContext) {
			return targetContext;
		}
	}

	return nil;
}

- (BOOL)isDynamicBundle:(NSString *)bundleName {
	NSArray *bundleList = [[XTMultiBundleManager shared].dataSource getDynamicBundleList];
	CPLog2(@"bundleList：%@", bundleList);
	
	BOOL isDynamicBundle = false;
	
	for (NSInteger i = 0; i <bundleList.count; i++) {
		NSDictionary *bundleObj = bundleList[i];
		NSString *bundleNameStr = bundleObj[@"bundleName"];
		NSString *deliveryType = bundleObj[@"deliveryType"];
		if ([bundleName isEqualToString:bundleNameStr]) {
			isDynamicBundle = [deliveryType isEqualToString:@"DYNAMIC"];
			break;
		}
	}
	
	return isDynamicBundle;
}

- (XTJSBundleModel *)createDynamicBundleModel:(NSString *)bundleName {
	
	NSArray *bundleList = [[XTMultiBundleManager shared].dataSource getDynamicBundleList];
	
	NSString *deploymentKey = nil;
	NSString *port = @"";
	
	for (NSInteger i = 0; i <bundleList.count; i++) {
		NSDictionary *bundleObj = bundleList[i];
		NSString *bundleNameStr = bundleObj[@"bundleName"];
		
		if ([bundleName isEqualToString:bundleNameStr]) {
			deploymentKey = bundleObj[@"deploymentKey"];
			port = bundleObj[@"port"];
			break;
		}
	}
	
	if (!deploymentKey) {
		return nil;
	}
	
	NSString *preload_index = [NSString stringWithFormat:@"preload_%ld", bundleList.count -1];
	[self createBundleModel:preload_index deploymentKey:preload_index port:preload_index];
	
	XTJSBundleModel *newBundleModel = [self createBundleModel:bundleName deploymentKey:deploymentKey port:port];
	
	return newBundleModel;
}

- (XTJSBundleModel *)createBundleModel:(NSString *)bundleName deploymentKey:(NSString *)deploymentKey port:(NSString *)port {
	XTBundleData *bundleData = [[XTMultiBundleManager shared].dataSource getBundleData:bundleName deploymentKey:deploymentKey portNum:port ?: @""];
	
	XTJSBridgeDelegation *delegation = [[XTJSBridgeDelegation alloc] initWithBundleData:bundleData];
	
	XTJSBundleModel *bundleModel = [[XTJSBundleModel alloc] initWithJSBundleName:bundleData.jsBundleName moduleName:bundleData.moduleName codePushKey:bundleData.codePushKey portNum:bundleData.portNum isMain:bundleData.isMain isPreLoaded:NO bindTargetBundleName:@"" delegation:delegation];
	
	NSMutableArray *newBundleModelArr = [NSMutableArray arrayWithArray:self.bundleModelArray];
	[newBundleModelArr addObject:bundleModel];
	
	self.bundleModelArray = newBundleModelArr;
	
	return bundleModel;
}

- (void)releaseBundle:(NSString *)bundleName autoRelease:(BOOL)autoRelease {
	NSMutableArray *targetModelArr = [NSMutableArray array];
	for (XTJSBundleModel *model in self.bundleModelArray) {
		if ([model.jsBundleName isEqualToString:bundleName]) {
			[targetModelArr addObject:model];
		}
	}

	if (targetModelArr.count == 0) {
		return;
	}

	for (XTJSBundleModel *targetModel in targetModelArr) {
		XTJSRuntimeContext *targetContext = [self.cache objectForKey:targetModel];
		if (!targetContext) {
			continue;
		}

		[self.cache removeObjectForKey:targetModel];
		[self.weakHashTable removeObject:targetContext];
		[self.forceCacheCommon removeObject:targetModel.moduleName];
		[self.bundleModelArray removeObject:targetModel];

		if ([targetModel.moduleName hasPrefix:@"preload"]) {
			[self createBundleModel:targetModel.moduleName deploymentKey:targetModel.moduleName port:targetModel.moduleName];
		} else {
			[self createBundleModel:targetModel.jsBundleName deploymentKey:targetModel.codePushKey port:targetModel.portNum];
		}

		void (^invalidate)(void) = ^{
			[targetContext invalidateRuntime];
		};
		if ([NSThread isMainThread]) {
			invalidate();
		} else {
			dispatch_sync(dispatch_get_main_queue(), invalidate);
		}
	}
}

- (void)releaseBundleForce:(NSString *)bundleName {
	[self releaseBundle:bundleName autoRelease:NO];
}

/// Host 创建入口（对标 Bridge 的 initWithDelegate + attachFabric）。
- (RCTHost *)createAndStartHostWithDelegation:(XTJSBridgeDelegation *)delegation
                                launchOptions:(NSDictionary *)launchOptions {
	[delegation prepareHostExtraModules];
	RCTHostBundleURLProvider urlProvider = [delegation hostBundleURLProvider];
	// 与 RCTRootViewFactory Bridgeless 路径一致：开启 legacy NativeModule interop，
	// 否则 NativeModules.RNCNetInfo 等旧模块为 null，common 会 fatal，biz 无法执行。
	RCTEnableTurboModuleInterop(YES);
  // 开启 Bridge Proxy，部分依赖 bridge 对象的旧代码可通过 proxy 继续工作。
	RCTEnableTurboModuleInteropBridgeProxy(YES);
	RCTHost *host =
	    [[RCTHost alloc] initWithBundleURLProvider:urlProvider
	                                  hostDelegate:(id<RCTHostDelegate>)delegation
	                    turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)delegation
	                              jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
	                                return std::make_shared<facebook::react::RCTHermesInstance>(
	                                    nullptr, nullptr, /* allocInOldGenBeforeTTI */ false);
	                              }
	                                 launchOptions:launchOptions];
	[host setBundleURLProvider:urlProvider];
	[host start];
	return host;
}

- (XTJSRuntimeContext *)loadContextToCache:(XTJSBundleModel *)model isPreloadCommon:(BOOL)isPreloadCommon isPreloadBiz:(BOOL)isPreloadBiz {
	NSMutableDictionary *newOptions = [NSMutableDictionary dictionary];
	[newOptions setValue:model.jsBundleName forKey:@"xtBundleName"];
	[newOptions setValue:@(isPreloadCommon) forKey:@"isPreloadCommon"];
	[newOptions setValue:@(isPreloadBiz) forKey:@"isPreloadBiz"];
	
	CPLog2(@"开始初始化 runtime，绑定的 model：%@ delegation：%@", model, model.delegation);

	XTJSRuntimeContext *context = [[XTJSRuntimeContext alloc] init];
	context.launchOptions = newOptions;
	context.jsBundleName = model.jsBundleName;
	context.originalJsBundleName = model.jsBundleName;
	context.isMain = model.isMain;
	context.lastAccessTimestampMs = XT_RUNTIME_CURRENT_TIMESTAMP_MS;
	[XTJSRuntimeContext applyLaunchOptions:newOptions toContext:context];
	model.delegation.runtimeContext = context;
	[self.cache setObject:context forKey:model];
	[self.weakHashTable addObject:context];

	RCTHost *host = [self createAndStartHostWithDelegation:model.delegation launchOptions:newOptions];
	context.host = host;
	return context;
}

- (XTJSRuntimeContext *)setupPreloadCommonHost:(XTJSBundleModel *)realBundleModel isPreLoadBiz:(BOOL)isPreLoadBiz {
	NSString *realBundleName = realBundleModel.jsBundleName;

	XTJSBundleModel *preloadBundleModel = [self getPreloadCommonBundleModel:realBundleName];
	XTJSRuntimeContext *preLoadContext = preloadBundleModel ? [self.cache objectForKey:preloadBundleModel] : nil;

	if (preLoadContext && [preLoadContext isPreloadCommonCompleted]) {
		preLoadContext.jsBundleName = realBundleName;

		if ([preLoadContext isLoadingBizScript] && ![preLoadContext isBizLoadCompleted]) {
		} else {
			[self startLoadBizOnPreloadHost:preLoadContext
			               preloadBundleModel:preloadBundleModel
			                    realBundleModle:realBundleModel
			                      isPreLoadBiz:isPreLoadBiz];
		}

		preLoadContext.scriptLoadState = XTScriptLoadStateBizLoading;
		return preLoadContext;
	}

	return nil;
}

- (XTJSBundleModel *)getPreloadCommonBundleModel:(NSString *)realBundleName {
	for (XTJSBundleModel *model in self.bundleModelArray) {
		if ([model.moduleName hasPrefix:@"preload"]
		    && model.isPreLoaded
		    && [model.bindTargetBundleName isEqualToString:realBundleName]) {
			return model;
		}
	}

	for (NSString *slot in [[self.forceCacheCommon reverseObjectEnumerator] allObjects]) {
		for (XTJSBundleModel *model in self.bundleModelArray) {
			if (![model.moduleName isEqualToString:slot]) {
				continue;
			}
			if (model.isPreLoaded || model.bindTargetBundleName.length > 0) {
				continue;
			}
			XTJSRuntimeContext *ctx = [self.cache objectForKey:model];
			if (ctx.host && [ctx isPreloadCommonCompleted]) {
				return model;
			}
		}
	}
	return nil;
}

- (void)startLoadBizOnPreloadHost:(XTJSRuntimeContext *)context
               preloadBundleModel:(XTJSBundleModel *)preloadBundleModel
                  realBundleModle:(XTJSBundleModel *)realBundleModle
                     isPreLoadBiz:(BOOL)isPreLoadBiz {
	NSString *preloadSlot = preloadBundleModel.moduleName;
	CPLog2(@"认领 preload Common Host：%@ → %@ isPreLoadBiz=%@",
	       preloadSlot, realBundleModle.jsBundleName, @(isPreLoadBiz));

	preloadBundleModel.jsBundleName = realBundleModle.jsBundleName;
	preloadBundleModel.codePushKey = realBundleModle.codePushKey;
	preloadBundleModel.portNum = realBundleModle.portNum;
	preloadBundleModel.isPreLoaded = YES;
	preloadBundleModel.bindTargetBundleName = realBundleModle.jsBundleName;

	[self.forceCacheCommon removeObject:preloadSlot];

	context.jsBundleName = realBundleModle.jsBundleName;
	context.isMain = realBundleModle.isMain;
	// 对标 Bridge：认领后只改 jsBundleName，originalJsBundleName 保持 preload_*，整段加载共用同一 timing/transaction
	// context.originalJsBundleName = realBundleModle.jsBundleName;
	[context setPreloadBizMode:isPreLoadBiz];
	context.scriptLoadState = XTScriptLoadStateCommonCompleted;
	// 对标 Bridge：认领后 preload common 模式仍为 YES，Sentry 走 preloadCommonBundleLoadTracking
	context.lastAccessTimestampMs = XT_RUNTIME_CURRENT_TIMESTAMP_MS;

	[self.cache setObject:context forKey:realBundleModle];

	XTJSBridgeDelegation *delegation = preloadBundleModel.delegation;
	if (!delegation) {
		CPLog2(@"认领失败：preload 无 Delegation");
		return;
	}
	delegation.runtimeContext = context;
	[delegation commonEngineLoadBizBundle:context
	                        preLoadCommon:YES
	                          bundleModel:realBundleModle
	                          isPreLoadBiz:isPreLoadBiz];
}

- (NSArray <XTJSRuntimeContext *>*)fetchAllRuntimeContext {
	NSMutableArray <XTJSRuntimeContext *>*allContexts = self.weakHashTable.allObjects.mutableCopy;
	if (self.mainContext) {
		[allContexts addObject:self.mainContext];
	}
	return allContexts.copy;
}

- (XTJSBridgeDelegation *)delegationForContext:(XTJSRuntimeContext *)context {
	if (!context) {
		return nil;
	}
	if (self.mainContext == context) {
		return self.mainBundleModel.delegation;
	}
	for (XTJSBundleModel *model in self.bundleModelArray) {
		if (model.delegation.runtimeContext == context) {
			return model.delegation;
		}
	}
	return nil;
}

- (NSString *)fetchDefaultModuleNameWithJSBundleName:(NSString *)jsbundleName {
	NSString *mainModuleName = self.mainBundleModel.jsBundleName;
	if ([jsbundleName isEqualToString:mainModuleName]) {
		return mainModuleName;
	}

	XTJSBundleModel *currentModel;
	for (XTJSBundleModel *model in self.bundleModelArray) {
		if ([model.jsBundleName isEqualToString:jsbundleName] && ![model.moduleName hasPrefix:@"preload"]) {
			currentModel = model;
			break;
		}
	}

	return currentModel.moduleName;
}

- (NSString *)queryCodePushDeploymentKeyWithExtensionName:(NSString *)extensionName {
	for (XTJSBundleModel *model in self.bundleModelArray) {
		NSString *bundleName = model.jsBundleName;
		if ([bundleName isEqualToString:extensionName]) {
			return model.codePushKey;
		}
	}
	return nil;
}

@end
