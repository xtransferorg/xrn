//
//  XTReloadCommandHelper.h
//  xrngo
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

#ifdef __cplusplus
extern "C" {
#endif

/// Cmd+R / DevMenu reload 前：用当前前台 bundle 的 Metro biz URL 更新 RCTReloadCommand.bundleURL
void XTReloadCommandUpdateBundleURLFromCurrentContext(void);

/// Metro reload 前：只对匹配的 Host 清拆包闸门
void XTReloadCommandPrepareMatchingHosts(NSURL *_Nullable commandBundleURL);

/// 是否应对该 reload listener（RCTHost）执行 reload
BOOL XTReloadCommandShouldReloadListener(id listener, NSURL *_Nullable commandBundleURL);

/// 多 Host 下摇一摇 DevMenu：仅当前前台 Host 的 DevMenu 可弹出
BOOL XTDevMenuShouldPresentOnShake(id devMenu);

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END
