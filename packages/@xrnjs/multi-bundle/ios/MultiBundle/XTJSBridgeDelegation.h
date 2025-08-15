//
//  XTJSBridgeDelegation.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeDelegate.h>
#import "XTMultiBundleProtocol.h"

@class XTBundleData;
NS_ASSUME_NONNULL_BEGIN

@interface XTJSBridgeDelegation : NSObject<RCTBridgeDelegate>

- (instancetype)initWithBundleData:(XTBundleData *)bundleData;

@end

NS_ASSUME_NONNULL_END
