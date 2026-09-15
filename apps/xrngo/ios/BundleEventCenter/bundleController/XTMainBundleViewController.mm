//
//  XTMainBundleViewController.m
//  xrngo
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTMainBundleViewController.h"

#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTHost.h>

@implementation XTMainBundleViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  [self loadMainView];
}

- (void)loadMainView {
  RCTHost *host = (RCTHost *)self.runtimeContext.host;
  NSAssert(host != nil, @"Host-only: MainVC requires runtimeContext.host");
  if (self.fabricSurface) {
    [self startSurfaceWhenBizReady];
    return;
  }

  NSMutableDictionary *mutInitialProps = [NSMutableDictionary dictionaryWithDictionary:self.initialProperties];
  [mutInitialProps setObject:self.moduleName ?: @"" forKey:@"moduleName"];

  RCTFabricSurface *surface =
      [[RCTFabricSurface alloc] initWithSurfacePresenter:host.surfacePresenter
                                              moduleName:self.moduleName
                                       initialProperties:mutInitialProps];
  [self attachFabricSurface:surface toHost:host];

  UIView *rootView = [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];
  rootView.backgroundColor = [UIColor whiteColor];
  rootView.frame = CGRectMake(0, 0, UIScreen.mainScreen.bounds.size.width, UIScreen.mainScreen.bounds.size.height);
  [self.view insertSubview:rootView atIndex:0];

  [self startSurfaceWhenBizReady];
}

@end
