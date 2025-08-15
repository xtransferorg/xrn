//
//  XTPopViewManager.h
//  xtapp
//
//  Created by liwenjin on 2022/8/30.
//  Copyright © 2022 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
NS_ASSUME_NONNULL_BEGIN

@interface XTPopViewManager : NSObject<RCTBridgeModule>

- (void)showLoading;

@end

NS_ASSUME_NONNULL_END
