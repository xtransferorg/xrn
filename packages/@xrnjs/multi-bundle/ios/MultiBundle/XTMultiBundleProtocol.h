//
//  XTMultiBundleProtocol.h
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/28.
//

#ifndef XTMultiBundleProtocol_h
#define XTMultiBundleProtocol_h
#import <React/RCTBridge.h>

@class XTBundleData;
@class XTJSRuntimeContext;

@protocol XTMultiBundleDataSource<NSObject>

@required
- (NSArray <XTBundleData *>*_Nonnull)multiBundleForBundleModelArray;

@optional
- (NSDictionary *_Nullable)multiBundleForLaunchOptions;

- (XTBundleData *_Nonnull)getBundleData:(NSString *_Nonnull)bundleName deploymentKey:(NSString *_Nonnull)deploymentKey portNum:(NSString *_Nonnull)portNum;

- (NSArray *_Nonnull)getDynamicBundleList;

@end

/// Bundle 资源 / CodePush / 生命周期：Host-only 下以 Context 为唯一入参。
@protocol XTBundleProvider<NSObject>

@required

/// 供 Host / Interop 注入的额外 NativeModule（如 CodePush）
- (NSArray<id<RCTBridgeModule>> *_Nonnull)extraModulesForContext:(XTJSRuntimeContext *_Nullable)context
                                                      bundleData:(XTBundleData *_Nonnull)bundleData;

/// 拆包: 1.解析 common 首包 URL（hostBundleURLProvider / Delegation 首包 loadBundleAtURL 会调用）  原 -[sourceURLForBridge:bundleData:]
- (NSURL *_Nonnull)bundleURLForContext:(XTJSRuntimeContext *_Nonnull)context
                            bundleData:(XTBundleData *_Nonnull)bundleData;

@optional

/// Step ① 幂等第二次 resolve（RCTHost.start 后 Instance 再 load）；YES 时 Delegation 跳过 context 状态重置
- (BOOL)isIdempotentBundleURLResolveForContext:(XTJSRuntimeContext *_Nonnull)context
                                    bundleData:(XTBundleData *_Nonnull)bundleData;

/// Host reload 即将开始（Delegation.prepareForHostReload）；Provider 在此记下 skip-sync 等副作用，勿渗进加载管线判据
- (void)hostContextWillReload:(XTJSRuntimeContext *_Nonnull)context
                   bundleData:(XTBundleData *_Nonnull)bundleData;

/// 拆包: 2.JS 即将执行（Delegation 在 loadCallback 提交脚本前回调，对标 Bridge RCTJavaScriptWillStartExecuting）
- (void)hostContextWillExecuteSourceCode:(XTJSRuntimeContext *_Nonnull)context
                              bundleData:(XTBundleData *_Nonnull)bundleData
                                isCommon:(BOOL)isCommon;

/// 拆包: 3.common 在 Runtime 内执行完成（Delegation 回调；仅副作用，不触发 load biz）
- (void)hostContextDidLoadCommon:(XTJSRuntimeContext *_Nonnull)context
                      bundleData:(XTBundleData *_Nonnull)bundleData;

/// 拆包: 4a.是否现在 load biz（CodePush sync 闸门 / preload 槽位）
- (BOOL)shouldLoadBizForContext:(XTJSRuntimeContext *_Nonnull)context
                     bundleData:(XTBundleData *_Nonnull)bundleData
                  preLoadCommon:(BOOL)preLoadCommon;

/// 拆包: 4b.解析 biz URL（含 bizBundleLoadStarted 幂等；不负责 Host.load）
- (NSURL *_Nullable)bizBundleURLForContext:(XTJSRuntimeContext *_Nonnull)context
                              bundleData:(XTBundleData *_Nonnull)bundleData
                           preLoadCommon:(BOOL)preLoadCommon;

/// 拆包: 5.biz 加载完成（Delegation.notifyBizLoadedOnHost 回调 Provider） 原 -[didLoadJS:] biz 分支
- (void)hostContextDidLoadBiz:(XTJSRuntimeContext *_Nonnull)context
                   bundleData:(XTBundleData *_Nonnull)bundleData;

/// 预加载 common 复用后加载 biz（Host preload Common 恢复前可为空实现）
- (void)commonEngineLoadBizBundleForContext:(XTJSRuntimeContext *_Nonnull)context
                              preLoadCommon:(BOOL)preLoadCommon
                                 bundleData:(XTBundleData *_Nonnull)bundleData
                               isPreLoadBiz:(BOOL)isPreLoadBiz;

- (BOOL)supportCommonBundleForBundleData:(XTBundleData *_Nonnull)bundleModel;

@end


#endif /* XTMultiBundleProtocol_h */
