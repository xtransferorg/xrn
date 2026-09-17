//
//  XTBundleProvider.m
//  XRNTemplate
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTBundleProvider.h"
#import <CodePush/CodePush.h>
#import "XTJSBundleTool.h"
#import "XRNTemplate-Swift.h"
#import "XTPluginManage.h"

#if DEBUG
#import "XTMetroAutoConnector.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTInspectorDevServerHelper.h>
#endif

@interface XTBundleProvider ()

@property (nonatomic, weak) XTBundleData *bundleData;
@property (strong, nonatomic) CodePush *codePush;
@property (strong, nonatomic) NSURL *bizBundleURL;
@property (assign, nonatomic) BOOL bizBundleLoadStarted;

#if DEBUG
@property (assign, nonatomic) BOOL isDebug;
- (BOOL)resolveMetroDebugForBundleData:(XTBundleData *)bundleData context:(XTJSRuntimeContext *)context;
- (void)attachMetroPackagerConnectionForContext:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData;
#endif

@end

@implementation XTBundleProvider

- (NSURL *)commonBundleURL {
  return [[NSBundle mainBundle] URLForResource:[XTJSBundleTool.shared getCommonBundleName] withExtension:@"jsbundle"];
}

- (NSURL *)embeddedBizBundleURL:(XTBundleData *)bundleData {
  NSURL *url = [self.codePush bundleURLForResource:bundleData.jsBundleName];
  if (!url) {
    url = [[NSBundle mainBundle] URLForResource:bundleData.jsBundleName withExtension:@"jsbundle"];
  }
  return url;
}

#pragma mark -- Metro（仅 DEBUG；能力对齐主工程）
#if DEBUG
- (BOOL)resolveMetroDebugForBundleData:(XTBundleData *)bundleData context:(XTJSRuntimeContext *)context {
  self.isDebug = NO;
  BOOL enableDebug = [XTMetroAutoConnector checkMetroConnection:bundleData.jsBundleName];
  if (!enableDebug) {
    return NO;
  }
  self.isDebug = YES;

  NSString *host = [[XTPluginManage shareInstance] getLocalHost];
  NSString *port = bundleData.portNum.length > 0 ? bundleData.portNum : [XTJSBundleTool.shared getMainBundlePort];
  // 不走拆包：Metro 可达时直接加载全量业务包
  NSURL *bundleUrl = [NSURL URLWithString:[NSString stringWithFormat:
                                           @"http://%@:%@/index.bundle?platform=ios&dev=true&lazy=false&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=XRNTemplate&port=%@",
                                           host, port, port]];
  self.bizBundleURL = bundleUrl;
  context.bizBundleURL = bundleUrl;
  NSLog(@"[XTBundleProvider] Host Debug Metro 全量包（%@）：%@", bundleData.jsBundleName, bundleUrl);
  return YES;
}

- (void)attachMetroPackagerConnectionForContext:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData {
  NSURL *metroURL = context.bizBundleURL ?: self.bizBundleURL;
  if (!metroURL || metroURL.isFileURL || !context.host) {
    return;
  }
  [RCTInspectorDevServerHelper connectWithBundleURL:metroURL];
  NSString *hostStr = [[XTPluginManage shareInstance] getLocalHost];
  if (hostStr.length > 0 && bundleData.portNum.length > 0) {
    [[RCTBundleURLProvider sharedSettings] setJsLocation:[NSString stringWithFormat:@"%@:%@", hostStr, bundleData.portNum]];
  }
  NSLog(@"[XTBundleProvider] Host Metro packager 已注册：%@ port=%@ url=%@", bundleData.jsBundleName, bundleData.portNum, metroURL);
}
#endif

/// RCTHost.start 会先调一次 BundleURLProvider，随后 Instance 再 load 时又会走 Delegation.resolve。
- (BOOL)isIdempotentBundleURLResolveForContext:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData {
  return context.providerCodePush != nil && self.codePush == context.providerCodePush;
}

- (NSURL *_Nonnull)bundleURLForContext:(XTJSRuntimeContext *_Nonnull)context bundleData:(XTBundleData *_Nonnull)bundleData {
  self.bundleData = bundleData;

  if ([self isIdempotentBundleURLResolveForContext:context bundleData:bundleData]) {
    // 不走拆包：幂等二次解析仍返回业务包
    return self.bizBundleURL ?: context.bizBundleURL;
  }

  self.bizBundleLoadStarted = NO;

  NSString *deploymentKey = bundleData.codePushKey;
  NSString *localCodePsuhKey = [[XTPluginManage shareInstance] getLocalCodePushKey:bundleData.jsBundleName];
  deploymentKey = localCodePsuhKey ?: deploymentKey;

#if DEBUG
  deploymentKey = @"";
#endif

  self.codePush = [[CodePush alloc] initWithDeploymentKey:deploymentKey isPreDownload:NO];
  context.providerCodePush = self.codePush;

  NSURL *bizBundleURL = [self embeddedBizBundleURL:bundleData];
  self.bizBundleURL = bizBundleURL;
  context.bizBundleURL = bizBundleURL;

#if DEBUG
  if ([self resolveMetroDebugForBundleData:bundleData context:context]) {
    // Metro 可达：直接加载全量业务包
    return self.bizBundleURL;
  }
#endif

  // Debug（Metro 不可达）/ Release：不走 common 拆包，直接加载本地业务包
  NSAssert(self.bizBundleURL != nil, @"Host: missing biz jsbundle %@", bundleData.jsBundleName);
  return self.bizBundleURL;
}

- (BOOL)shouldLoadBizForContext:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData preLoadCommon:(BOOL)preLoadCommon {
  // 首包已是全量业务包，不再二次 load biz
  return NO;
}

- (NSURL *)bizBundleURLForContext:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData preLoadCommon:(BOOL)preLoadCommon {
  // 不走拆包，无二次 biz 加载
  return nil;
}

#if DEBUG
- (void)hostContextDidLoadBiz:(XTJSRuntimeContext *)context bundleData:(XTBundleData *)bundleData {
  if (self.isDebug) {
    [self attachMetroPackagerConnectionForContext:context bundleData:bundleData];
  }
}
#endif

- (NSArray<id<RCTBridgeModule>> *_Nonnull)extraModulesForContext:(XTJSRuntimeContext *_Nullable)context bundleData:(XTBundleData *_Nonnull)bundleData {
  return self.codePush ? @[self.codePush] : @[];
}

- (BOOL)supportCommonBundleForBundleData:(XTBundleData *_Nonnull)bundleModel {
  // Debug / Release 均不走 common 拆包
  return NO;
}

@end
