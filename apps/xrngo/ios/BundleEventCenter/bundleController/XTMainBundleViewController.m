//
//  XTMainBundleViewController.m
//  xrngo
//
//  Created by  xtgq on 2025/6/27.
//

#import "XTMainBundleViewController.h"
#import <React/RCTRootView.h>

@interface XTMainBundleViewController ()

@end

@implementation XTMainBundleViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.
  
  [self loadMainView];
}

- (void)loadMainView {
  NSMutableDictionary *mutInitialProps = [NSMutableDictionary dictionaryWithDictionary:self.initialProperties];
  [mutInitialProps setObject:self.moduleName ?: @"" forKey:@"moduleName"];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                   moduleName:self.moduleName
                                            initialProperties:mutInitialProps];
  rootView.backgroundColor = [UIColor whiteColor];
  rootView.frame = CGRectMake(0, 0, UIScreen.mainScreen.bounds.size.width, UIScreen.mainScreen.bounds.size.height);
  self.view = rootView;
}

- (BOOL)concurrentRootEnabled
{
  // Switch this bool to turn on and off the concurrent root
  return true;
}

@end
