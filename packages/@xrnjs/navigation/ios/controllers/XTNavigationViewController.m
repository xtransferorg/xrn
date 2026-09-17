//
//  XTNavigationViewController.m
//  xtapp
//
//  Created by liyuan on 2024/1/15.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"
#import "XTBaseBundleViewController.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>

@interface XTNavigationViewController ()<UIGestureRecognizerDelegate, UINavigationControllerDelegate>

@end

@implementation XTNavigationViewController

- (instancetype)initWithRootViewController:(UIViewController *)rootViewController {
    self = [super initWithRootViewController:rootViewController];
    if (self) {
        BOOL isMain = [rootViewController isKindOfClass:[XTBaseBundleViewController class]];
        NSString *desc = [NSString stringWithFormat:@"Error: rootViewController class is %@", NSStringFromClass(rootViewController.class)];
        NSAssert(isMain, desc);
        if (isMain) {
            [XTNativeRouterManager.shared configNav:self
                                 rootViewController:(XTBaseBundleViewController *)rootViewController];
        } else {
            @throw [NSException exceptionWithName:@"InvalidViewControllerException" reason:desc userInfo:nil];
        }
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    
    [self setNavigationBarHidden:YES];
    self.interactivePopGestureRecognizer.delegate = self;
    self.delegate = self;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer {
    if (self.viewControllers.count <= 1 ) {
        return NO;
    }
    return YES;
}

// didShowViewController 不会受到侧滑手势未完成的影响，也不会有无用信息的追溯
- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated {
    if ([viewController conformsToProtocol:@protocol(XTViewControllerProtocol)]) {
        UIViewController <XTViewControllerProtocol>*vc = (UIViewController <XTViewControllerProtocol>*)viewController;
        NSString *moduleName = vc.moduleName;
        NSString *bundleName = vc.runtimeContext.jsBundleName;
        NSString *vcLevel = [NSString stringWithFormat:@"%lu", navigationController.viewControllers.count];
        
        if (moduleName != nil &&
            [moduleName isKindOfClass:NSString.class] &&
            bundleName != nil &&
            [bundleName isKindOfClass:NSString.class]) {
            if ([self.lifecycleObserver respondsToSelector:@selector(didShowViewController:moduleName:bundleName:vcLevel:)]) {
                [self.lifecycleObserver didShowViewController:viewController moduleName:moduleName bundleName:bundleName vcLevel:vcLevel];
            }
        } else {
            if ([self.lifecycleObserver respondsToSelector:@selector(didShowViewControllerWithError:)]) {
                [self.lifecycleObserver didShowViewControllerWithError:@"bundleName or moduleName has somthing wrong"];
            }
        }
    } else {
        if ([self.lifecycleObserver respondsToSelector:@selector(didShowViewControllerWithError:)]) {
            [self.lifecycleObserver didShowViewControllerWithError:@"vc do not conforms XTViewControllerProtocol"];
        }
    }
}

@end
