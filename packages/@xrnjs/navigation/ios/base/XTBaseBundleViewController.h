//
//  XTBaseBundleViewController.h
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "XTViewControllerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@class XTJSRuntimeContext;
@class RCTFabricSurface;
@class RCTHost;

@interface XTPageSideSwipeInfo : NSObject

@property (nonatomic, assign) bool interceptSideSwipe; // 是否拦截
@property (nonatomic, copy) NSString *routeKey; // 页面routeKey

@end

@interface XTBaseBundleViewController : UIViewController<XTViewControllerProtocol>

@property (nonatomic, strong, readonly) XTJSRuntimeContext *runtimeContext;
@property (nonatomic, copy, readonly) NSString *moduleName;
/// Host Fabric Surface（Main / 子 bundle VC 共用 reload + whenSurfaceReady 逻辑）
@property (nonatomic, strong, readonly, nullable) RCTFabricSurface *fabricSurface;

/// 创建 Surface 后：attach 到 Host 并注册 reload 监听
- (void)attachFabricSurface:(RCTFabricSurface *)surface toHost:(RCTHost *)host;
- (void)startSurfaceWhenBizReady;

// 控制器绑定一个导航容器key
@property (nonatomic, copy) NSString *rootStackKey;
// 控制器绑定一个navigation state
@property (nonatomic, copy) NSString *navigationState;
// 控制器绑定一个控制页面滑动的信息
@property (nonatomic, strong) NSMutableArray <XTPageSideSwipeInfo*> *pageSideSwipeInfos; // 是否拦截

// 只有XTMainBundleViewController需要实现此方法，XTBundleViewController不需要实现
- (void)removeAniamtionVCAndPlaceHolderImage;

// 设置当前页面是否处理手势与rn页面的routeKey
- (void)addPageSideSwipeInfos:(BOOL)shouldIntercept routeKey:(NSString *)routeKey;
// 清除被返回页面的信息
- (void)removePageSideSwipeInfos;

@end

NS_ASSUME_NONNULL_END
