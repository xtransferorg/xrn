//
//  XTNativeRouterManager.h
//  xtapp
//
//  Created by liyuan on 2024/1/12.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "XTNavigationViewController.h"
#import "XTBundleViewControllerProtocol.h"

@class XTBaseBundleViewController;

extern XTNavigationViewController * _Nullable xtNavController(void);

NS_ASSUME_NONNULL_BEGIN

@interface XTNativeRouterManager : NSObject

+ (instancetype)shared;

@property (nonatomic, strong) id<XTBundleViewControllerProtocol> bundleVCFactory;

@property (nonatomic, weak, readonly) XTNavigationViewController *nav;
@property (nonatomic, weak, readonly) XTBaseBundleViewController *rootViewController;

- (void)configNav:(XTNavigationViewController *)nav
rootViewController:(XTBaseBundleViewController *)rootViewController;

- (void)pushViewController:(NSString *)bundleName moduleName:(NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties replace:(BOOL)replace;

- (void)popViewControllerAnimated:(BOOL)animated;

- (void)popToRootViewControllerAnimated:(BOOL)animated;

- (void)switchModuleWith:(NSString *)bundleName moduleName:(NSString *)moduleName;

@end

NS_ASSUME_NONNULL_END
