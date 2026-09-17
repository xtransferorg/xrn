//
//  XTJSRuntimeContext.m
//  xtapp
//
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSRuntimeContext.h"
#import "XTJSBridgePool.h"
#import "XTJSBridgeDelegation.h"

NSNotificationName const XTRuntimeWillStartLoadingNotification = @"XTRuntimeWillStartLoading";
NSNotificationName const XTRuntimeWillStartExecutingNotification = @"XTRuntimeWillStartExecuting";
NSNotificationName const XTRuntimeDidFailToLoadNotification = @"XTRuntimeDidFailToLoad";
NSNotificationName const XTBizBundleLoadSuccessNotification = @"XTBizBundleLoadSuccess";
NSNotificationName const XTHostDidReloadNotification = @"XTHostDidReload";

NSString * const XTRuntimeNotificationBundleNameKey = @"bundleName";
NSString * const XTRuntimeNotificationContextKey = @"context";

// 本地轻量声明，避免 #import RCTHost.h（会拉入 C++）。
@interface RCTHost : NSObject
- (id)moduleRegistry;
- (void)_reloadWithShouldRestartSurfaces:(BOOL)shouldRestartSurfaces;
- (void)didReceiveReloadCommand;
@end

@interface XTJSRuntimeContext ()
@property (nonatomic, strong) NSMutableArray<XTSurfaceReadyBlock> *surfaceReadyBlocks;
@end

@implementation XTJSRuntimeContext

+ (void)postRuntimeNotification:(NSNotificationName)name
                        context:(XTJSRuntimeContext *)context
                     bundleName:(NSString *)bundleName {
	if (name.length == 0) {
		return;
	}
	NSString *resolvedName = bundleName;
	if (resolvedName.length == 0) {
		resolvedName = context.jsBundleName;
	}
	NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
	if (resolvedName.length > 0) {
		userInfo[XTRuntimeNotificationBundleNameKey] = resolvedName;
	}
	if (context) {
		userInfo[XTRuntimeNotificationContextKey] = context;
	}
	void (^post)(void) = ^{
		[[NSNotificationCenter defaultCenter] postNotificationName:name
		                                                    object:context.host
		                                                  userInfo:userInfo.count > 0 ? userInfo : nil];
	};
	if ([NSThread isMainThread]) {
		post();
	} else {
		dispatch_async(dispatch_get_main_queue(), post);
	}
}

+ (void)applyLaunchOptions:(NSDictionary *)launchOptions toContext:(XTJSRuntimeContext *)context {
	if (!context || launchOptions.count == 0) {
		return;
	}
	if ([launchOptions[@"isPreloadCommon"] boolValue]) {
		[context setPreloadCommonMode:YES];
	}
	if ([launchOptions[@"isPreloadBiz"] boolValue]) {
		[context setPreloadBizMode:YES];
	}
}

- (instancetype)init {
	self = [super init];
	if (self) {
		_surfaceReadyBlocks = [NSMutableArray array];
		_scriptLoadState = XTScriptLoadStateNone;
		_scriptLoadMode = XTScriptLoadModeNone;
	}
	return self;
}

- (BOOL)isPreloadCommonMode {
	return (self.scriptLoadMode & XTScriptLoadModePreloadCommon) != 0;
}

- (BOOL)isPreloadBizMode {
	return (self.scriptLoadMode & XTScriptLoadModePreloadBiz) != 0;
}

- (void)setPreloadCommonMode:(BOOL)enabled {
	if (enabled) {
		self.scriptLoadMode |= XTScriptLoadModePreloadCommon;
	} else {
		self.scriptLoadMode &= ~XTScriptLoadModePreloadCommon;
	}
}

- (void)setPreloadBizMode:(BOOL)enabled {
	if (enabled) {
		self.scriptLoadMode |= XTScriptLoadModePreloadBiz;
	} else {
		self.scriptLoadMode &= ~XTScriptLoadModePreloadBiz;
	}
}

- (BOOL)shouldStopAtCommonOnly {
	// 认领后 jsBundleName 已是真实名，即使仍挂着 PreloadCommon 标志也不停
	return [self isPreloadCommonMode] && [self.jsBundleName hasPrefix:@"preload"];
}

- (void)resetScriptLoadModeForReload {
	if ([self.jsBundleName hasPrefix:@"preload"]) {
		self.scriptLoadMode = XTScriptLoadModePreloadCommon;
	} else {
		self.scriptLoadMode = XTScriptLoadModeNone;
	}
}

- (BOOL)isPreloadCommonCompleted {
	return [self isPreloadCommonMode] && self.scriptLoadState >= XTScriptLoadStateCommonCompleted;
}

- (BOOL)isCommonLoadCompleted {
	return self.scriptLoadState >= XTScriptLoadStateCommonCompleted;
}

- (BOOL)isLoadingBizScript {
	return self.scriptLoadState == XTScriptLoadStateBizLoading;
}

- (BOOL)isBizLoadCompleted {
	return self.scriptLoadState == XTScriptLoadStateBizCompleted;
}

- (void)resetScriptLoadState {
	self.scriptLoadState = XTScriptLoadStateNone;
}

- (void)updateLastAccessTime {
	self.lastAccessTimestampMs = XT_RUNTIME_CURRENT_TIMESTAMP_MS;
}

- (BOOL)hostReadyForSurface {
	if (!self.host) {
		return YES;
	}
	return [self isBizLoadCompleted];
}

- (void)whenSurfaceReady:(XTSurfaceReadyBlock)block {
	if (!block) {
		return;
	}
	XTSurfaceReadyBlock work = ^{
		BOOL ready = [self hostReadyForSurface];
		if (ready) {
			block();
			return;
		}
		[self.surfaceReadyBlocks addObject:[block copy]];
	};
	if ([NSThread isMainThread]) {
		work();
	} else {
		dispatch_async(dispatch_get_main_queue(), work);
	}
}

- (void)flushSurfaceReadyBlocks {
	void (^flush)(void) = ^{
		if (self.surfaceReadyBlocks.count == 0) {
			return;
		}
		NSArray<XTSurfaceReadyBlock> *blocks = [self.surfaceReadyBlocks copy];
		[self.surfaceReadyBlocks removeAllObjects];
		for (XTSurfaceReadyBlock block in blocks) {
			block();
		}
	};
	if ([NSThread isMainThread]) {
		flush();
	} else {
		dispatch_async(dispatch_get_main_queue(), flush);
	}
}

- (void)clearSurfaceReadyBlocks {
	void (^clear)(void) = ^{
		[self.surfaceReadyBlocks removeAllObjects];
	};
	if ([NSThread isMainThread]) {
		clear();
	} else {
		dispatch_async(dispatch_get_main_queue(), clear);
	}
}

#pragma mark -

- (nullable id)moduleForClass:(Class)moduleClass {
	if (!moduleClass || !self.host) {
		return nil;
	}
	id registry = [self.host moduleRegistry];
	if ([registry respondsToSelector:@selector(moduleForClass:)]) {
		return [registry moduleForClass:moduleClass];
	}
	return nil;
}

/// reload 1.清理状态 2.host reload
- (void)requestReload {
	XTJSBridgeDelegation *delegation = [[XTJSBridgePool shared] delegationForContext:self];
	[delegation prepareForHostReload];

	id hostObj = self.host;
	if (hostObj && [hostObj respondsToSelector:@selector(_reloadWithShouldRestartSurfaces:)]) {
		[(RCTHost *)hostObj _reloadWithShouldRestartSurfaces:NO];
	}
}

- (void)invalidateRuntime {
	[self clearSurfaceReadyBlocks];
	self.host = nil;
}

@end
