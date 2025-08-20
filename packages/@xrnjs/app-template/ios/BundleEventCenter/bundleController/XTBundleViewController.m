//
//  XTBundleViewController.m
//  xrngo
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTBundleViewController.h"
#import <React/RCTRootView.h>

@interface XTBundleViewController ()

@end

@implementation XTBundleViewController

- (void)loadView {
  [super loadView];
  
  NSMutableDictionary *mutInitialProps = [NSMutableDictionary dictionaryWithDictionary:self.initialProperties ?: @{}];
  [mutInitialProps setObject:self.moduleName ?: @"" forKey:@"moduleName"];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                   moduleName:self.moduleName
                                            initialProperties:mutInitialProps];
  rootView.backgroundColor = UIColor.whiteColor;
  self.view = rootView;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.
  
}

@end
