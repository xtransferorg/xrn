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

@interface XTNavigationViewController ()<UIGestureRecognizerDelegate>

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

@end
