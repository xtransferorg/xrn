//
//  XTBundleViewControllerFactory.m
//  XRNTemplate
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTBundleViewControllerFactory.h"
#import "XTMainBundleViewController.h"
#import "XTBundleViewController.h"

@implementation XTBundleViewControllerFactory

- (UIViewController<XTViewControllerProtocol> *)createViewControllerWithIsMain:(BOOL)isMain runtimeContext:(XTJSRuntimeContext *)runtimeContext moduleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties {
  if (isMain) {
    return [[XTMainBundleViewController alloc] initWithRuntimeContext:runtimeContext moduleName:moduleName initialProperties:initialProperties];
  } else {
    return [[XTBundleViewController alloc] initWithRuntimeContext:runtimeContext moduleName:moduleName initialProperties:initialProperties];
  }
}


- (void)bundleNotFoundWith:(nonnull NSString *)bundleName moduleName:(nonnull NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties {

}

@end
