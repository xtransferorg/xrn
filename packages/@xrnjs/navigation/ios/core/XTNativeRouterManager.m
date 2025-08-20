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
//#import "XTToastView.h"

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

/**
 Push or replace a bundle module view controller on the native navigation stack.

 - Parameters:
   - bundleName: JS bundle name used to resolve an `RCTBridge`.
   - moduleName: React Native module name to be mounted in the view controller.
   - initialProperties: Initial props passed to the module (nullable).
   - replace: If YES, replace the top controller; if NO, push a new one.

 Behavior:
 1. Resolves the bridge via `XTMultiBundleManager.shared.pool` using `bundleName`; asserts and reports via `bundleVCFactory` if not found.
 2. Creates a view controller with `bundleVCFactory` using the resolved bridge and `moduleName`.
 3. If the bundle is the main bundle: record as `rootViewController` and pop to root.
 4. Otherwise: push or replace the top controller, with a guard to avoid replacing the only main controller.
 */
- (void)pushViewController:(NSString *)bundleName moduleName:(NSString *)moduleName initialProperties:(nullable NSDictionary *)initialProperties replace:(BOOL)replace {
    RCTBridge *bridge = [XTMultiBundleManager.shared.pool fetchJSBridgeWithJSBundleName:bundleName];
    if (!bridge) {
       NSString *desc = [NSString stringWithFormat:@"Error: there is no bridge for %@ bundle", bundleName];
       NSAssert(bridge, desc);
		// Bundle not found: show an error and report to Sentry (if supported)
		if ([self.bundleVCFactory respondsToSelector:@selector(bundleNotFoundWith: moduleName:initialProperties:)]) {
			[self.bundleVCFactory bundleNotFoundWith:bundleName moduleName:moduleName initialProperties:initialProperties];
		}
        return;
    }

    NSString *mainBundleName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundleName"];
    BOOL isMain = [bundleName isEqualToString:mainBundleName];
    UIViewController <XTViewControllerProtocol>*bundleVC = [self.bundleVCFactory createViewControllerWithIsMain:isMain bridge:bridge moduleName:moduleName initialProperties:initialProperties];
    
    if (isMain) {
        // Record the rootViewController reference
        self.rootViewController = (XTBaseBundleViewController *)bundleVC;
        [self popToRootViewControllerAnimated:YES];
    } else {
        if (replace) {
            // If replacing, replace the top view controller with the new bundle controller
            NSArray *vcs = self.nav.viewControllers;
            NSInteger lastIndex = vcs.count - 1;
            NSMutableArray *tempArr = [NSMutableArray arrayWithArray:vcs];
            // Bugfix: when only the main bundle exists in the stack, avoid replacing it with a sub-bundle which would prevent returning to home
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

/**
 Replace an existing controller for the specified bundle with a new controller hosting another module, reusing the same bridge.

 - Parameters:
   - bundleName: Target bundle name whose controller will be replaced.
   - moduleName: New module name to render in place.

 Behavior:
 1. Iterates the navigation stack from top to bottom to find a controller whose `RCTRootView` has a bridge and whose bundle matches `bundleName`.
 2. If found, creates a new controller using the same bridge and `moduleName`.
 3. Updates `rootViewController` if the bundle is the main bundle.
 4. Replaces the matched controller in the navigation stack without animation; asserts if not found.
 */
- (void)switchModuleWith:(NSString *)bundleName moduleName:(NSString *)moduleName {
    NSLog(@"switchModule%@===%@", bundleName, moduleName);
    NSArray *vcs = self.nav.viewControllers;
    NSArray *reversedVCs = [[vcs reverseObjectEnumerator] allObjects];
    UIViewController *targetVC = nil;
    RCTBridge *targetBridge = nil;
    for (UIViewController *vc in reversedVCs) {
        NSLog(@"UIViewController===%@", vc);
        RCTRootView *rootView = nil;
        NSMutableArray <UIView *>*views = [NSMutableArray arrayWithArray:vc.view.subviews];
        [views insertObject:vc.view atIndex:0];
        for (UIView *view in views) {
            if ([view isKindOfClass:[RCTRootView class]]) {
                rootView = (RCTRootView *)view;
                break;;
            }
        }
        if ([rootView hasBridge]) {
            RCTBridge *bundleBridge = rootView.bridge;
            targetBridge = bundleBridge;
            NSString *curBundleName = bundleBridge.xt_jsBundleName;
            if ([curBundleName isEqualToString:bundleName]) {
                targetVC = vc;
                break;
            }
        } else {
            NSAssert([rootView hasBridge], @"Please verify that the bundle and moduleName passed to switchModule are correct");
        }
    }
    
    if (targetVC && targetBridge) {
        NSString *mainBundleName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundleName"];
        BOOL isMain = [bundleName isEqualToString:mainBundleName];
        UIViewController <XTViewControllerProtocol>*newVc = [self.bundleVCFactory createViewControllerWithIsMain:isMain bridge:targetBridge moduleName:moduleName initialProperties:@{}];
        
        if (isMain) {
            // Record the rootViewController reference
            self.rootViewController = (XTBaseBundleViewController *)newVc;
        }
        NSUInteger targetVCIndex = [vcs indexOfObject:targetVC];
        if (targetVCIndex != NSNotFound) {
            NSMutableArray *tempArr = [NSMutableArray arrayWithArray:vcs];
            [tempArr replaceObjectAtIndex:targetVCIndex withObject:newVc];
            [xtNavController() setViewControllers:tempArr animated:NO];
        } else {
            NSAssert(targetVC, @"Please verify that the bundle and moduleName passed to switchModule are correct");
        }
    }
}

@end
