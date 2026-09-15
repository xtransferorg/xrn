//
//  XTJSBridgePool.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class XTJSBundleModel;
@class XTBundleData;
@class XTJSRuntimeContext;
@class XTJSBridgeDelegation;

#ifdef __cplusplus
extern "C" {
#endif

void CPLog2(NSString *formatString, ...);

#ifdef __cplusplus
}
#endif

@interface XTJSBridgePool : NSObject

+ (instancetype)shared;

- (void)setupAllJSBridgeInfo:(NSArray <XTBundleData *>*)bundleArray launchOptions:(NSDictionary *)launchOptions;

- (XTJSRuntimeContext *)fetchContextWithJSBundleName:(NSString *)jsbundleName;

/// 主 bundle 的 RuntimeContext（不依赖 bundle 名字符串）
- (nullable XTJSRuntimeContext *)fetchMainContext;

- (XTJSRuntimeContext *)fetchExistingContext:(NSString *)bundleName;

- (NSArray <XTJSRuntimeContext *>*)fetchAllRuntimeContext;

- (NSString *)fetchDefaultModuleNameWithJSBundleName:(NSString *)jsbundleName;
- (NSString *)queryCodePushDeploymentKeyWithExtensionName:(NSString *)bundleName;

- (void)releaseBundle:(NSString *)bundleName autoRelease:(BOOL)autoRelease;
- (void)releaseBundleForce:(NSString *)bundleName;

- (void)preLoadBundle:(NSString *)bundleName;
- (void)startPreloadCommon;

/// 根据 Context 反查其 Delegation（Host 加载 biz 时使用）
- (nullable XTJSBridgeDelegation *)delegationForContext:(XTJSRuntimeContext *)context;

@end

NS_ASSUME_NONNULL_END
