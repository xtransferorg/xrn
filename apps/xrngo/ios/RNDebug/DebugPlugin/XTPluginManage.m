//
//  XTPluginManage.m
//  XRNTemplate
//
//  Created by  xtgq on 2024/5/7.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTPluginManage.h"
#import "XTSuspendBall.h"
#import "BundleNavigation.h"
#import "RCTBridge+XTExtension.h"
#import "XTJSBundleTool.h"
#import "JSONUtils.h"
#import "XRNToastView.h"
#import "RNCConfig.h"
#import <React/RCTUtils.h>
#import "xrngo-Swift.h"

@interface XTPluginManage ()<SuspendViewDelegate>

@property (nonatomic, strong) NSMutableArray <NSMutableData *>*testDataArray;
@end

@implementation XTPluginManage

+ (instancetype)shareInstance {
    static XTPluginManage *_sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[XTPluginManage alloc] init];
        _sharedInstance.testDataArray = [NSMutableArray array];
    });
    return _sharedInstance;
}

- (void)addSuspendBallToWindow {
    XTSuspendBall *debugButton = [[XTSuspendBall alloc] init];
    debugButton.delegate = self;
    UIWindow *mainWindow = [[[UIApplication sharedApplication] delegate] window];
    [mainWindow addSubview:debugButton];
    [mainWindow bringSubviewToFront:debugButton];
}

- (void)suspendViewButtonClick:(nonnull UIButton *)sender {
    dispatch_async(dispatch_get_main_queue(), ^{
        RCTBridge *currentBridge = [[XTJSBundleTool shared] fetchCurrentBridge];
        if (currentBridge == nil) {
            return;
        }
        
        BundleNavigation *module = [currentBridge moduleForClass:[BundleNavigation class]];
        NSString *paramsStr = [JSONUtils dictionaryToJsonString:@{@"where":@"NATIVE"}];
        [module publishSingleBundleEvent:@"NATIVE_FLOAT_BAR_CLICK" params:paramsStr];
    });
}

- (void)pushJSErrorTipPanel:(NSString *)bundleName {
    NSString *localBundleDebug = [[NSUserDefaults standardUserDefaults] objectForKey:[NSString stringWithFormat:@"%@-debug", bundleName]];
    if (!localBundleDebug) return;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        XTLoadJSErrorTipPanel *vc = [[XTLoadJSErrorTipPanel alloc] init];
        vc.bundleName = bundleName;
        UIViewController *rootViewController = RCTPresentedViewController();
        [rootViewController presentViewController:vc animated:YES completion:nil];
    });
}

- (NSString *)getLocalHost {
    NSString *host = [[NSUserDefaults standardUserDefaults] stringForKey:@"RCT_jsLocation"];
    if (host.length > 0) {
        NSInteger index = [host rangeOfString:@":"].location;
        if (index != NSNotFound) {
            host = [host substringToIndex:index];
        }
    }
    
#if TARGET_OS_SIMULATOR
    host = @"localhost";
#else
    host = host ?: @"";
#endif
    return host;
}

- (NSString *)getLocalCodePushKey:(NSString *)bundleName {
    NSString *key = [NSString stringWithFormat:@"%@-codepush-key", bundleName];
    NSString *localCodePsuhKey = [[NSUserDefaults standardUserDefaults] objectForKey:key];
    return localCodePsuhKey;
}

@end
