//
//  XTJSRuntimeContext.h
//  xtapp
//
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

#define XT_RUNTIME_CURRENT_TIMESTAMP_MS (int64_t)([[NSDate date] timeIntervalSince1970] * 1000)

typedef void (^XTSurfaceReadyBlock)(void);



/// Host 运行时加载生命周期（替代 Bridge 的 RCTJavaScript* 通知，供 Sentry/Memory 旁路）
FOUNDATION_EXPORT NSNotificationName const XTRuntimeWillStartLoadingNotification;
FOUNDATION_EXPORT NSNotificationName const XTRuntimeWillStartExecutingNotification;
FOUNDATION_EXPORT NSNotificationName const XTRuntimeDidFailToLoadNotification;
/// 与历史字符串 @"XTBizBundleLoadSuccess" 同值
FOUNDATION_EXPORT NSNotificationName const XTBizBundleLoadSuccessNotification;
/// Host reload 后的 hostDidStart；Surface VC 按 object:host 监听
FOUNDATION_EXPORT NSNotificationName const XTHostDidReloadNotification;

FOUNDATION_EXPORT NSString * const XTRuntimeNotificationBundleNameKey;
FOUNDATION_EXPORT NSString * const XTRuntimeNotificationContextKey;

/// Bundle 加载阶段
typedef NS_ENUM(NSInteger, XTScriptLoadState) {
  XTScriptLoadStateNone = 0,        /// 未开始
  XTScriptLoadStateCommonLoading,   /// common加载中
  XTScriptLoadStateCommonCompleted, /// common加载完成
  XTScriptLoadStateBizLoading,      /// Biz加载中
  XTScriptLoadStateBizCompleted,    /// Biz加载完成
};

/// Bundle 加载模式
typedef NS_OPTIONS(NSUInteger, XTScriptLoadMode) {
  XTScriptLoadModeNone = 0,               /// 普通模式
  XTScriptLoadModePreloadCommon = 1 << 0, /// 预加载Common
  XTScriptLoadModePreloadBiz = 1 << 1,    /// 预加载Biz
};

@interface XTJSRuntimeContext : NSObject

@property (nonatomic, copy, nullable) NSString *jsBundleName;  /** 当前业务名；preload 认领后改为真实 bundle */
@property (nonatomic, copy, nullable) NSString *originalJsBundleName;  /** 创建时名字，认领后仍为 preload_*（tracking）；加载控制勿用此字段判槽位 */

@property (nonatomic, assign) XTScriptLoadState scriptLoadState;  /** 加载进度：None → Common → Biz */
@property (nonatomic, assign) XTScriptLoadMode scriptLoadMode;    /** 意图标志：PreloadCommon / PreloadBiz（可与 state 组合查询） */
@property (nonatomic, assign) BOOL isMain;  /** 是否主 bundle（来自 XTBundleData / XTJSBundleModel） */

@property (nonatomic, assign) BOOL needPostReloadNoti;        /** prepareForHostReload 置 YES；下次 hostDidStart 发完 XTHostDidReload 后清 NO */

@property (nonatomic, assign) int64_t lastAccessTimestampMs;  /** 最近一次访问时间（Pool 回收用）*/

@property (nonatomic, strong, nullable) id providerCodePush;  /** 当前 bundle 绑定的 CodePush 实例（bundleURL 幂等）*/

@property (nonatomic, strong, nullable) id host;  /** RCTHost；id 暴露避免 Swift 导入 C++*/

@property (nonatomic, copy, nullable) NSDictionary *launchOptions;  /** Host 创建时的 launchOptions；reload 后会清 nil*/
@property (nonatomic, strong, nullable) NSURL *bizBundleURL;  /** biz 包 URL（CodePush / 资源查找）*/

/// 从 launchOptions 写入 scriptLoadMode（isPreloadCommon / isPreloadBiz）
+ (void)applyLaunchOptions:(nullable NSDictionary *)launchOptions toContext:(XTJSRuntimeContext *)context;

- (BOOL)isPreloadCommonMode;
- (BOOL)isPreloadBizMode;
- (void)setPreloadCommonMode:(BOOL)enabled;
- (void)setPreloadBizMode:(BOOL)enabled;

/// 未认领 preload 槽：preloadCommon 模式且当前名仍为 preload_* → common 后停，不 load biz
- (BOOL)shouldStopAtCommonOnly;

/// reload 时按当前 jsBundleName 重置 mode（preload_* 只保留 PreloadCommon；否则清掉全部 mode）
- (void)resetScriptLoadModeForReload;

/// preload 槽位 common 是否已 eval 完成
- (BOOL)isPreloadCommonCompleted;
/// common 是否已 eval 完成（含 CommonCompleted / LoadingBiz / BizCompleted）
- (BOOL)isCommonLoadCompleted;
- (BOOL)isLoadingBizScript;
- (BOOL)isBizLoadCompleted;

- (void)resetScriptLoadState;

/// Host：biz 已就绪时可挂 Surface / flush whenSurfaceReady
- (BOOL)hostReadyForSurface;

/// 对标 Bridge `_runAfterLoad` / pendingCalls：已 ready 立即执行，否则排队，biz 完成后 flush。
- (void)whenSurfaceReady:(XTSurfaceReadyBlock)block;

/// biz 就绪后由 Delegation flush（放行排队的 Surface start）
- (void)flushSurfaceReadyBlocks;

/// Host reload 前清空排队，避免旧回调在新一轮 common→biz 中提前 start
- (void)clearSurfaceReadyBlocks;

/// Host.moduleRegistry 取 NativeModule
- (nullable id)moduleForClass:(Class)moduleClass;

/// Host reload（RCTReloadListener）：prepareForHostReload + Host._reload
- (void)requestReload;

/// 释放 Host 引用（给 Swift 旁路用）
- (void)invalidateRuntime;

- (void)updateLastAccessTime;

/// 旁路监控用：统一 post，userInfo 带 bundleName + context
+ (void)postRuntimeNotification:(NSNotificationName)name
                        context:(nullable XTJSRuntimeContext *)context
                     bundleName:(nullable NSString *)bundleName;

@end

NS_ASSUME_NONNULL_END
