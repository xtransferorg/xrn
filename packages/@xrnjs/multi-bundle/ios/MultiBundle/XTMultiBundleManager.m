//
//  XTMultiBundleManager.m
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/26.
//

#import "XTMultiBundleManager.h"
#import "XTJSBundleModel.h"
#import "XTJSBridgePool.h"

@interface XTMultiBundleManager ()

@property (nonatomic, weak) XTJSBridgePool *pool;

@end

@implementation XTMultiBundleManager

+ (instancetype)shared {
    static XTMultiBundleManager *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XTMultiBundleManager alloc] init];
    });
    return shareInstance;
}

- (void)startUp {
  NSAssert(self.dataSource != nil, @"MultiBundle not set dataSource");
  NSArray <XTBundleData *>*bundleModelArray = [self.dataSource multiBundleForBundleModelArray];
  NSDictionary *launchOptions = [[self.dataSource multiBundleForLaunchOptions] copy];
  self.pool = XTJSBridgePool.shared;
  [XTJSBridgePool.shared setupAllJSBridgeInfo:bundleModelArray launchOptions:launchOptions];
}


@end
