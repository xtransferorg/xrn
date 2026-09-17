//
//  XTNativeRouterManager.m
//  xtapp
//
//  Created by liyuan on 2024/1/12.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTNativeRouterManager.h"
#import "XTNavigationViewController.h"
#import "XTBaseBundleViewController.h"
#import "XTViewControllerProtocol.h"
#import <React/RCTRootView.h>
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>

XTNavigationViewController *xtNavController(void) {
    return XTNativeRouterManager.shared.nav;
}

@interface XTNativeRouterManager ()

@property (nonatomic, weak) XTNavigationViewController *nav;
@property (nonatomic, weak) XTBaseBundleViewController *rootViewController;

@end

@implementation XTNativeRouterManager

+ (instancetype)shared {
    static XTNativeRouterManager *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XTNativeRouterManager alloc] init];
    });
    return shareInstance;
}

- (void)configNav:(XTNavigationViewController *)nav rootViewController:(XTBaseBundleViewController *)rootViewController {
    self.nav = nav;
    self.rootViewController = rootViewController;
}

- (void)pushViewController:(NSString *)bundleName moduleName:(NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties replace:(BOOL)replace {
  
  XTJSRuntimeContext *context = [XTMultiBundleManager.shared.pool fetchContextWithJSBundleName:bundleName];
  if (!context || !context.host) {
		if ([self.bundleVCFactory respondsToSelector:@selector(bundleNotFoundWith: moduleName:initialProperties:)]) {
			[self.bundleVCFactory bundleNotFoundWith:bundleName moduleName:moduleName initialProperties:initialProperties];
		}
    return;
  }

  [context updateLastAccessTime];

    BOOL isMain = context.isMain;
    UIViewController <XTViewControllerProtocol>*bundleVC =
        [self.bundleVCFactory createViewControllerWithIsMain:isMain
                                              runtimeContext:context
                                                  moduleName:moduleName
                                           initialProperties:initialProperties];
    
    if (isMain) {
        // rootViewController记录
        self.rootViewController = (XTBaseBundleViewController *)bundleVC;
        [self popToRootViewControllerAnimated:YES];
    } else {
        if (replace) {
            // 如果是replace，则需要操作导航栈，将栈顶的vc替换成bundleVC
            NSArray *vcs = self.nav.viewControllers;
            NSInteger lastIndex = vcs.count - 1;
            NSMutableArray *tempArr = [NSMutableArray arrayWithArray:vcs];
            // bugfix，当vcs中只有main bundle时，这时如果调用replace，子bundle控制器会替换掉main，导致页面无法返回到首页
            if (vcs.count > lastIndex && vcs.count > 1) {
                [tempArr replaceObjectAtIndex:lastIndex withObject:bundleVC];
                [xtNavController() setViewControllers:tempArr animated:YES];
            } else {
                [xtNavController() pushViewController:bundleVC animated:YES];
            }
        } else {
            [xtNavController() pushViewController:bundleVC animated:YES];
        }
    }
}

- (void)popViewControllerAnimated:(BOOL)animated {
    [xtNavController() popViewControllerAnimated:animated];
}

- (void)popToRootViewControllerAnimated:(BOOL)animated {
    [xtNavController() popToRootViewControllerAnimated:animated];
}

- (void)switchModuleWith:(NSString *)bundleName moduleName:(NSString *)moduleName {
    NSLog(@"switchModule%@===%@", bundleName, moduleName);
    NSArray *vcs = self.nav.viewControllers;
    NSArray *reversedVCs = [[vcs reverseObjectEnumerator] allObjects];
    UIViewController *targetVC = nil;
    XTJSRuntimeContext *targetContext = nil;
    for (UIViewController *vc in reversedVCs) {
        NSLog(@"UIViewController===%@", vc);
        if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
            XTBaseBundleViewController *baseVC = (XTBaseBundleViewController *)vc;
            XTJSRuntimeContext *ctx = baseVC.runtimeContext;
            if (ctx && [ctx.jsBundleName isEqualToString:bundleName]) {
                targetVC = vc;
                targetContext = ctx;
                break;
            }
        }
    }
    
    if (targetVC && targetContext) {
        BOOL isMain = targetContext.isMain;
        UIViewController <XTViewControllerProtocol>*newVc =
            [self.bundleVCFactory createViewControllerWithIsMain:isMain
                                                  runtimeContext:targetContext
                                                      moduleName:moduleName
                                               initialProperties:@{}];
        if (!newVc) {
            return;
        }
        
        if (isMain) {
            self.rootViewController = (XTBaseBundleViewController *)newVc;
        }
        NSUInteger targetVCIndex = [vcs indexOfObject:targetVC];
        if (targetVCIndex != NSNotFound) {
            NSMutableArray *tempArr = [NSMutableArray arrayWithArray:vcs];
            [tempArr replaceObjectAtIndex:targetVCIndex withObject:newVc];
            [xtNavController() setViewControllers:tempArr animated:NO];
        } else {
            NSAssert(targetVC, @"请检查switchModule的bundle和moduleName是否正确");
        }
    }
}

@end
