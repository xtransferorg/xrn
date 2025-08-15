//
//  XTBundleViewControllerProtocol.h
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import "XTViewControllerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@protocol XTBundleViewControllerProtocol <NSObject>

@required

// 协议：工厂方法创建对应的控制器
- (UIViewController<XTViewControllerProtocol> *)createViewControllerWithIsMain:(BOOL)isMain bridge:(RCTBridge *)bridge moduleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties;

// 跨bundle跳转时，未找到对应的bundle时，错误提示&上报sentry
- (void)bundleNotFoundWith:(NSString *)bundleName moduleName:(NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties;
@end

NS_ASSUME_NONNULL_END
