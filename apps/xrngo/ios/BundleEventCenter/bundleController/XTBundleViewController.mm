//
//  XTBundleViewController.m
//  xrngo
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTBundleViewController.h"

#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTHost.h>

@implementation XTBundleViewController

- (void)loadView {
  [super loadView];

  RCTHost *host = (RCTHost *)self.runtimeContext.host;
  NSAssert(host != nil, @"Host-only: XTBundleViewController requires runtimeContext.host");

  NSMutableDictionary *mutInitialProps = [NSMutableDictionary dictionaryWithDictionary:self.initialProperties ?: @{}];

  RCTFabricSurface *surface =
      [[RCTFabricSurface alloc] initWithSurfacePresenter:host.surfacePresenter
                                              moduleName:self.moduleName
                                       initialProperties:mutInitialProps];
  [self attachFabricSurface:surface toHost:host];

  UIView *rootView = [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];
  rootView.backgroundColor = UIColor.whiteColor;
  self.view = rootView;

  [self startSurfaceWhenBizReady];
}

- (void)viewDidLoad {
  [super viewDidLoad];
}

@end
