//
//  XTBaseBundleViewController.m
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTBaseBundleViewController.h"
#import "XRNNavigation.h"
#import "JSONUtils.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>

@interface XTBaseBundleViewController ()

@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSDictionary *initialProperties;

@end

@implementation XTBaseBundleViewController

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties {
    self = [super initWithNibName:nil bundle:nil];
    if (self) {
        self.bridge = bridge;
        self.moduleName = moduleName;
        self.initialProperties = initialProperties;
        self.rootStackKey = @"";
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.view.backgroundColor = UIColor.whiteColor;
}

- (void)setRootStackKey:(NSString *)rootStackKey {
    _rootStackKey = rootStackKey;
}

- (void)setNavigationState:(NSString *)navigationState {
    _navigationState = navigationState;
}

- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear: animated];
    [self postEmitWithEventName:@"XT_SCREEN_APPEAR"];
}

- (void)viewDidDisappear:(BOOL)animated {
    [super viewDidDisappear:animated];
    [self postEmitWithEventName:@"XT_SCREEN_DISAPPEAR"];
}

- (void)postEmitWithEventName:(NSString *)eventName {
	XRNNavigation *module = [self.bridge moduleForClass:XRNNavigation.class];
    NSString *curBundleName = self.bridge.xt_jsBundleName ?: @"";
    NSDictionary *params = @{@"bundleName":curBundleName, @"moduleName":self.moduleName ?: @"", @"rootKey":self.rootStackKey ?: @""};
	NSString *actionStr = [JSONUtils dictionaryToJsonString:params];
    [module sendCustomEvent:eventName data:actionStr];
}

- (void)removeAniamtionVCAndPlaceHolderImage {
    
}

@end
