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
#import "XRNToastView.h"
#import "JSONUtils.h"
#import "XTJSBundleTool.h"
#import "RCTBridge+XTExtension.h"

@implementation XTBundleViewControllerFactory


/// create bundle controller
/// - Parameters:
///   - isMain: isMain description
///   - bridge: bridge description
///   - moduleName: moduleName description
///   - initialProperties: initialProperties description
- (UIViewController<XTViewControllerProtocol> *)createViewControllerWithIsMain:(BOOL)isMain bridge:(RCTBridge *)bridge moduleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties {
  if (isMain) {
    return [[XTMainBundleViewController alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
  } else {
    return [[XTBundleViewController alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
  }
}


- (void)bundleNotFoundWith:(nonnull NSString *)bundleName moduleName:(nonnull NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties {
  
}

@end
