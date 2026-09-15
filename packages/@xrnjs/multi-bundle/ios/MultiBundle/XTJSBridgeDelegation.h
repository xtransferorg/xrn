//
//  XTJSBridgeDelegation.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "XTMultiBundleProtocol.h"

@class XTBundleData;
@class XTJSBundleModel;
@class XTJSRuntimeContext;

NS_ASSUME_NONNULL_BEGIN

@protocol XTJSRuntimeContextModule <NSObject>

- (void)setRuntimeContext:(XTJSRuntimeContext *)runtimeContext;

@end

@interface XTJSBridgeDelegation : NSObject

@property (nonatomic, strong, readonly) XTBundleData *bundleData;
@property (nonatomic, strong, nonnull, readonly) id<XTBundleProvider> provider;

@property (nonatomic, weak, nullable) XTJSRuntimeContext *runtimeContext;

- (instancetype)initWithBundleData:(XTBundleData *)bundleData;

- (void)updateBundleData:(XTBundleData *)bundleData;

- (void)commonEngineLoadBizBundle:(XTJSRuntimeContext *)context preLoadCommon:(BOOL)preLoadCommon bundleModel:(XTJSBundleModel * _Nonnull)bundleModel isPreLoadBiz:(BOOL)isPreLoadBiz;

- (void)prepareHostExtraModules;

- (NSURL *_Nullable (^)(void))hostBundleURLProvider;

/// Host reload 唯一入口：重置 script/preload/surface + Provider.hostContextWillReload，再由调用方触发 Host._reload
- (void)prepareForHostReload;

- (void)requestLoadBizBundleOnHost:(NSURL *)bizURL;

/// 拆包 Step 4：common 就绪后尝试 load biz（问 Provider 闸门 + URL，内部 requestLoadBizBundleOnHost）
- (void)loadBizAfterCommonIfNeededWithPreLoadCommon:(BOOL)preLoadCommon;

@end

NS_ASSUME_NONNULL_END
