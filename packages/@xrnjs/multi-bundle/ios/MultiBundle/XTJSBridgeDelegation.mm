//
//  XTJSBridgeDelegation.mm
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBridgeDelegation.h"
#import "XTBundleData.h"
#import "XTJSBundleModel.h"
#import "XTJSBridgePool.h"
#import "XTJSRuntimeContext.h"

#import <React/RCTJavaScriptLoader.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <React/CoreModulesPlugins.h>
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <objc/message.h>

@interface XTJSBridgeDelegation () <RCTTurboModuleManagerDelegate, RCTHostDelegate>

@property (nonatomic, copy) NSDictionary<NSString *, id<RCTBridgeModule>> *preCreatedModulesByClass;
@property (nonatomic, strong, readwrite) XTBundleData *bundleData;
@property (nonatomic, strong, nonnull, readwrite) id<XTBundleProvider> provider;

@end

@implementation XTJSBridgeDelegation

- (void)dealloc {
  CPLog2(@"🔴 XTJSBridgeDelegation dealloc: %@ (bundleData：%@) (provider: %@)", self, self.bundleData, self.provider);
}

- (instancetype)initWithBundleData:(XTBundleData *)bundleData {
  self = [super init];
  if (self) {
    self.bundleData = bundleData;
    self.provider = bundleData.provider;
  }
  return self;
}

- (void)updateBundleData:(XTBundleData *)bundleData {
	self.bundleData = bundleData;
	self.provider = bundleData.provider;
}

/// 当前业务 bundle 名：以 bundleData 为准（认领后会改成真实名；originalJsBundleName 仍为创建时 preload_*）
- (NSString *)currentJsBundleName {
	return self.bundleData.jsBundleName;
}

- (NSURL *)bundleURLForContext {
	XTJSRuntimeContext *context = self.runtimeContext;
	if ([self.provider respondsToSelector:@selector(bundleURLForContext:bundleData:)] && context) {
		NSString *jsBundleName = [self currentJsBundleName];
		context.jsBundleName = jsBundleName;
		// original 只在空时补一次；认领后不得覆盖（仍保留 preload_* 供 tracking）
		if (context.originalJsBundleName.length == 0) {
			context.originalJsBundleName = jsBundleName;
		}
		context.lastAccessTimestampMs = XT_RUNTIME_CURRENT_TIMESTAMP_MS;

		[XTJSRuntimeContext applyLaunchOptions:context.launchOptions toContext:context];

		BOOL isIdempotentResolve = NO;
		if ([self.provider respondsToSelector:@selector(isIdempotentBundleURLResolveForContext:bundleData:)]) {
			isIdempotentResolve = [self.provider isIdempotentBundleURLResolveForContext:context
			                                                                 bundleData:self.bundleData];
		}
		if (!isIdempotentResolve) {
			[context resetScriptLoadState];
		}

		return [self.provider bundleURLForContext:context bundleData:self.bundleData];
	}
	return nil;
}

- (BOOL)supportCommonBundle {
	if ([self.provider respondsToSelector:@selector(supportCommonBundleForBundleData:)]) {
		return [self.provider supportCommonBundleForBundleData:self.bundleData];
	}
	return NO;
}

- (void)commonEngineLoadBizBundle:(XTJSRuntimeContext *)context
                    preLoadCommon:(BOOL)preLoadCommon
                      bundleModel:(XTJSBundleModel *)bundleModel
                     isPreLoadBiz:(BOOL)isPreLoadBiz {
	if ([self.provider respondsToSelector:@selector(commonEngineLoadBizBundleForContext:preLoadCommon:bundleData:isPreLoadBiz:)]) {
		self.bundleData.jsBundleName = bundleModel.jsBundleName;
		self.bundleData.codePushKey = bundleModel.codePushKey;
		self.bundleData.portNum = bundleModel.portNum;
		self.bundleData.isMain = bundleModel.isMain;

		[self updateBundleData:self.bundleData];

		// 认领：只改当前名，不动 originalJsBundleName
		context.jsBundleName = bundleModel.jsBundleName;
		context.isMain = bundleModel.isMain;
		[context setPreloadBizMode:isPreLoadBiz];
		self.runtimeContext = context;

		[self.provider commonEngineLoadBizBundleForContext:context
		                                     preLoadCommon:preLoadCommon
		                                        bundleData:self.bundleData
		                                      isPreLoadBiz:isPreLoadBiz];
	}
}

- (void)prepareForHostReload {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context) {
		return;
	}
	// reload = 重置 state/mode + Provider 副作用；随后 Host 再走一遍 common→biz
	context.jsBundleName = [self currentJsBundleName];
	[context resetScriptLoadState];
	[context resetScriptLoadModeForReload];
	context.providerCodePush = nil;
	context.launchOptions = nil;
	context.needPostReloadNoti = YES;

	[context clearSurfaceReadyBlocks];

	if ([self.provider respondsToSelector:@selector(hostContextWillReload:bundleData:)]) {
		[self.provider hostContextWillReload:context bundleData:self.bundleData];
	}
}

#pragma mark -- RCTHostDelegate && 拆包 1→5（编排集中在此文件；Provider 供 URL/闸门/副作用）
//
// ① bundleURLForContext          ← 非幂等时 resetScriptLoadState + Provider（URL/CodePush）
// ② loadBundleAtURL              ← RCTJavaScriptLoader + loadCallback（inject，多 Host 可并发）
// ③ hostDidLoadBundleSuccess: ← common 完成 / biz 完成 / chainLoadBiz
//    hostContextDidLoadCommon     ← Provider 副作用
// ④ loadBizAfterCommonIfNeeded   ← Provider.shouldLoadBiz + bizBundleURL → requestLoadBizBundleOnHost
// ⑤ notifyBizLoadedOnHost        ← hostContextDidLoadBiz + flushSurfaceReadyBlocks
//
// reload：prepareForHostReload（唯一入口）→ Host._reload；加载管线只认 scriptLoadState
// CodePush sync 完成后：Provider 调 [delegation loadBizAfterCommonIfNeeded]（仍走 ④）
//
- (void)hostDidStart:(RCTHost *)host {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (context) {
		context.host = host;
		if (context.needPostReloadNoti) {
			context.needPostReloadNoti = NO;
			[[NSNotificationCenter defaultCenter] postNotificationName:XTHostDidReloadNotification object:host userInfo:@{XTRuntimeNotificationContextKey: context}];
		}
	}
}

/// 拆包: 1.提供bundle加载的url
- (NSURL *_Nullable (^)(void))hostBundleURLProvider {
  __weak __typeof(self) weakSelf = self;
  return ^NSURL * {
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    return strongSelf ? [strongSelf bundleURLForContext] : nil;
  };
}


/// 拆包: 2.处理bundle的加载，调用RCTJavaScriptLoader loadBundleAtURL方法
/// 首次加载common，第二次加载biz
- (void)loadBundleAtURL:(NSURL *)sourceURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)loadCallback {
	XTJSRuntimeContext *context = self.runtimeContext;
	BOOL supportsCommon = [self supportCommonBundle];
	// 同轮拆包：BizLoading 时再进这里是 load biz，不能 prepare（会重走 common）。
	// BizCompleted 后再 load = 上一轮已结束，按 reload 处理。
	BOOL isReload = context && [context isBizLoadCompleted];
	NSURL *urlToLoad = sourceURL;
	if (isReload) {
		[self prepareForHostReload];
		context = self.runtimeContext;
		NSURL *resolved = [self bundleURLForContext];
		if (resolved) {
			urlToLoad = resolved;
		}
	}
	BOOL isLoadingBiz = supportsCommon && context && [context isLoadingBizScript];

  // 判断是加载common还是biz

	__weak __typeof(self) weakSelf = self;
  // 真正加载bunldeURL
	[RCTJavaScriptLoader loadBundleAtURL:urlToLoad
                            onProgress:onProgress
                            onComplete:^(NSError *error, RCTSource *source) {
		__strong __typeof(weakSelf) strongSelf = weakSelf;
		if (!strongSelf) {
			if (loadCallback) {
				loadCallback(error, source);
			}
			return;
		}

		if (error) {
			XTJSRuntimeContext *ctx = strongSelf.runtimeContext;
			if (isLoadingBiz && ctx) {
				ctx.scriptLoadState = XTScriptLoadStateCommonCompleted;
			}
			[XTJSRuntimeContext postRuntimeNotification:XTRuntimeDidFailToLoadNotification
			                                    context:ctx
			                                 bundleName:[strongSelf currentJsBundleName]];
			if (loadCallback) {
				loadCallback(error, source);
			}
			return;
		}

		XTJSRuntimeContext *execContext = strongSelf.runtimeContext;
		if (!execContext) {
			if (loadCallback) {
				loadCallback(nil, source);
			}
			return;
		}
		if ([strongSelf.provider respondsToSelector:@selector(hostContextWillExecuteSourceCode:bundleData:isCommon:)]) {
			BOOL isCommon = supportsCommon && !isLoadingBiz;
			[strongSelf.provider hostContextWillExecuteSourceCode:execContext
			                                           bundleData:strongSelf.bundleData
			                                             isCommon:isCommon];
		}

		if (supportsCommon && !isLoadingBiz) {
			execContext.scriptLoadState = XTScriptLoadStateCommonLoading;
		}
		if (!execContext.host) {
			[strongSelf xrn_handleScriptInjectFailedIsLoadingBiz:isLoadingBiz];
			return;
		}
		if (loadCallback) {
			loadCallback(nil, source);
		}
	}];
}

/// 拆包: 3. eval 成功 → biz 完成或 common 完成后 chain load biz
- (void)hostDidLoadBundleSuccess:(RCTHost *)host
{
	XTJSRuntimeContext *ctx = self.runtimeContext;
	if (!ctx || ctx.host != host) {
		return;
	}

	BOOL supportsCommon = [self supportCommonBundle];
	BOOL isLoadingBiz = supportsCommon && [ctx isLoadingBizScript];
	if (!supportsCommon || isLoadingBiz) {
		[self notifyBizLoadedOnHost];
		return;
	}

	ctx.scriptLoadState = XTScriptLoadStateCommonCompleted;
	[self chainLoadBizBundleAfterCommonIfNeeded];
}

/// 拆包: 4.1 common 加载完成 →  load biz
- (void)chainLoadBizBundleAfterCommonIfNeeded {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context || !context.host) {
		return;
	}

	if ([self.provider respondsToSelector:@selector(hostContextDidLoadCommon:bundleData:)]) {
		[self.provider hostContextDidLoadCommon:context bundleData:self.bundleData];
	}

	[self loadBizAfterCommonIfNeededWithPreLoadCommon:NO];
}

/// 拆包: 4.2 向 Provider 取闸门与 biz URL，再 Host.loadJSBundleAtURL(biz)
- (void)loadBizAfterCommonIfNeededWithPreLoadCommon:(BOOL)preLoadCommon {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context || !context.host) {
		return;
	}
	id<XTBundleProvider> provider = self.provider;
	if ([provider respondsToSelector:@selector(shouldLoadBizForContext:bundleData:preLoadCommon:)]) {
		if (![provider shouldLoadBizForContext:context bundleData:self.bundleData preLoadCommon:preLoadCommon]) {
			return;
		}
	}
	NSURL *bizURL = nil;
	if ([provider respondsToSelector:@selector(bizBundleURLForContext:bundleData:preLoadCommon:)]) {
		bizURL = [provider bizBundleURLForContext:context bundleData:self.bundleData preLoadCommon:preLoadCommon];
	}
	if (!bizURL) {
		return;
	}
	[self requestLoadBizBundleOnHost:bizURL];
}

/// 拆包: 5.开始加载biz（Host 第二段 inject）
- (void)requestLoadBizBundleOnHost:(NSURL *)bizURL {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context || !context.host || !bizURL) {
		return;
	}
	context.scriptLoadState = XTScriptLoadStateBizLoading;
	context.bizBundleURL = bizURL;

	[context.host loadJSBundleAtURL:bizURL];
}

/// 拆包: 6.biz加载完成
- (void)notifyBizLoadedOnHost {
	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context) {
		return;
	}
	context.scriptLoadState = XTScriptLoadStateBizCompleted;
	if ([self.provider respondsToSelector:@selector(hostContextDidLoadBiz:bundleData:)]) {
		[self.provider hostContextDidLoadBiz:context bundleData:self.bundleData];
	}
	[context flushSurfaceReadyBlocks];
}

/// 处理 inject 失败（如 Host 尚未就绪）
- (void)xrn_handleScriptInjectFailedIsLoadingBiz:(BOOL)isLoadingBiz {
  XTJSRuntimeContext *ctx = self.runtimeContext;
  if (isLoadingBiz && ctx) {
    ctx.scriptLoadState = XTScriptLoadStateCommonCompleted;
  }
  [XTJSRuntimeContext postRuntimeNotification:XTRuntimeDidFailToLoadNotification
                                      context:ctx
                                   bundleName:[self currentJsBundleName]];
}


#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
	return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
																											jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
	return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
																										 initParams:(const facebook::react::ObjCTurboModule::InitParams &)params
{
	return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
	NSString *className = NSStringFromClass(moduleClass);
	id<RCTBridgeModule> preCreated = self.preCreatedModulesByClass[className];

	id<RCTTurboModule> module = nil;
	if (preCreated && [preCreated conformsToProtocol:@protocol(RCTTurboModule)]) {
		module = (id<RCTTurboModule>)preCreated;
	} else {
		module = RCTAppSetupDefaultModuleFromClass(moduleClass, [RCTAppDependencyProvider new]);
	}

	if (module && self.runtimeContext && [module respondsToSelector:@selector(setRuntimeContext:)]) {
		((void (*)(id, SEL, XTJSRuntimeContext *))objc_msgSend)(module, @selector(setRuntimeContext:), self.runtimeContext);
	}
	return module;
}

- (void)prepareHostExtraModules {
  (void)[self bundleURLForContext];

  NSArray<id<RCTBridgeModule>> *modules = @[];
  if ([self.provider respondsToSelector:@selector(extraModulesForContext:bundleData:)]) {
    modules = [self.provider extraModulesForContext:self.runtimeContext bundleData:self.bundleData];
  }

  NSMutableDictionary<NSString *, id<RCTBridgeModule>> *map = [NSMutableDictionary new];
  for (id<RCTBridgeModule> module in modules) {
    NSString *className = NSStringFromClass([module class]);
    map[className] = module;
  }
  self.preCreatedModulesByClass = [map copy];
}

@end
