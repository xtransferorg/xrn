//
//  XTBundleProvider.m
//  XRNTemplate
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTBundleProvider.h"
#import <CodePush/CodePush.h>
#import "XTJSBundleModel.h"
#import "XTJSBundleTool.h"
#import "RCTBridge+XTExtension.h"
#import "xrngo-Swift.h"
#import "XTPluginManage.h"

@interface XTBundleProvider ()

@property (nonatomic, weak) XTBundleData *bundleData;
@property (strong, nonatomic) CodePush *codePush;
@property (strong, nonatomic) NSURL *bizBundleURL;

#if DEBUG
@property (assign, nonatomic) BOOL isDebug;
#endif
@end

@implementation XTBundleProvider

- (instancetype)init {
  self = [super init];
  if (self) {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didLoadJS:) name:RCTJavaScriptDidLoadNotification object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTJavaScriptDidLoadNotification object:nil];
}


- (void)didLoadJS:(NSNotification *)notification {
  if ([notification.object isKindOfClass:RCTBridge.class]) {
    RCTBridge *bridge = (RCTBridge *)notification.object;
    NSString *bizBundleName = self.bundleData.jsBundleName;
//    if ([bridge.xt_jsBundleName isEqualToString:bizBundleName] &&
//        bridge.isLoading) {
//        //NSURL *bizBundleURL = [self.codePush bundleURLForResource:bizBundleName];
//        NSURL *bizBundleURL = self.bizBundleURL;
//        #if DEBUG
//        [bridge loadAndExecuteSplitBundleURL:bizBundleURL onError:^(NSError *error) {
//            NSLog(@"🐯 error---%@", error);
//            [[XTPluginManage shareInstance] pushJSErrorTipPanel:bridge.xt_jsBundleName];
//        } onComplete:^{
//            NSLog(@"🐯 complete---");
//        }];
//        #else
//        NSData *subBundleData = [NSData dataWithContentsOfURL:bizBundleURL];
//        [bridge.batchedBridge executeSourceCode:subBundleData withSourceURL:bizBundleURL sync:NO];
//        #endif
//    }
  }
}


/// RCTBridge RCTBridgeDelegate
/// - Parameters:
///   - bridge: bridge description
///   - bundleData: bundleData description
- (NSURL *_Nonnull)sourceURLForBridge:(RCTBridge *_Nonnull)bridge bundleData:(XTBundleData *_Nonnull)bundleData {
  self.bundleData = bundleData;
  
  NSString *deploymentKey = bundleData.codePushKey;
  NSString *localCodePsuhKey = [[XTPluginManage shareInstance] getLocalCodePushKey:bundleData.jsBundleName];
  deploymentKey = localCodePsuhKey ?: deploymentKey;
  
#if DEBUG
  deploymentKey = @"";
#endif
  
  self.codePush = [[CodePush alloc] initWithDeploymentKey:deploymentKey];
  
  NSURL *bizBundleURL = [self.codePush bundleURLForResource:bundleData.jsBundleName];
  self.bizBundleURL = bizBundleURL;
#if DEBUG
  self.isDebug = NO;
  NSString *localBundleDebug = [[NSUserDefaults standardUserDefaults] objectForKey:[NSString stringWithFormat:@"%@-debug", bundleData.jsBundleName]];
  if (localBundleDebug) {
    self.isDebug = [localBundleDebug boolValue];
  }

  if (self.isDebug) {
    BOOL supportCommon = [bridge.delegate supportCommonBundle];
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSString *appVersion = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
    NSString *appVersionParam = supportCommon ? [NSString stringWithFormat:@"&appVersion=%@", appVersion] : @"";
    NSString *host = [[XTPluginManage shareInstance] getLocalHost];
    NSURL *bundleUrl = [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:%@/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=XRNTemplate%@", host, bundleData.portNum, appVersionParam]];
    bizBundleURL = bundleUrl;
    self.bizBundleURL = bizBundleURL;
    bridge.bizBundleURL = bizBundleURL;
    return supportCommon ? [[NSBundle mainBundle] URLForResource:[XTJSBundleTool.shared getCommonBundleName] withExtension:@"jsbundle"] : bizBundleURL;
  }
#endif
  bridge.bizBundleURL = bizBundleURL;
  //  return [[NSBundle mainBundle] URLForResource:[XTJSBundleTool.shared getCommonBundleName] withExtension:@"jsbundle"];
  //  return [[NSBundle mainBundle] URLForResource:bundleData.jsBundleName withExtension:@"jsbundle"];
  return bizBundleURL;
}

- (NSArray<id<RCTBridgeModule>> *_Nonnull)extraModulesForBridge:(RCTBridge *_Nonnull)bridge bundleData:(XTBundleData *_Nonnull)bundleData {
  return @[self.codePush];
}

- (BOOL)supportCommonBundleForBundleData:(XTBundleData *_Nonnull)bundleModel {
//    BOOL supportCommon = YES;
//  #if DEBUG
//    if (!self.isDebug) {
//        return YES;
//    }
//    NSString *enbaleCommon = [NSUserDefaults.standardUserDefaults stringForKey:[NSString stringWithFormat:@"%@-supportCommon", bundleModel.jsBundleName]];
//    supportCommon = ![enbaleCommon isEqualToString:@"0"];
//  #endif
//    return supportCommon;
  return NO;
}

@end
