//
//  XTJSBridgeDelegation.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBridgeDelegation.h"
#import "XTBundleData.h"

@interface XTJSBridgeDelegation ()

@property (nonatomic, strong) XTBundleData *bundleData;
@property (nonatomic, strong, nonnull) id<XTBundleProvider> provider;

@end

@implementation XTJSBridgeDelegation

- (instancetype)initWithBundleData:(XTBundleData *)bundleData {
  self = [super init];
  if (self) {
    self.bundleData = bundleData;
    self.provider = bundleData.provider;
  }
  return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  if ([self.provider respondsToSelector:@selector(sourceURLForBridge:bundleData:)]) {
    return [self.provider sourceURLForBridge:bridge 
                                  bundleData:self.bundleData];
  }
  return nil;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  if ([self.provider respondsToSelector:@selector(extraModulesForBridge:bundleData:)]) {
    return [self.provider extraModulesForBridge:bridge
                                     bundleData:self.bundleData];
  }
  return @[];
}

- (BOOL)supportCommonBundle {
  if ([self.provider respondsToSelector:@selector(supportCommonBundleForBundleData:)]) {
    return [self.provider supportCommonBundleForBundleData:self.bundleData];
  }
  return NO;
}

@end
