//
//  XTPluginManage.h
//  XRNTemplate
//
//  Created by  xtgq on 2024/5/7.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTPluginManage : NSObject

+ (instancetype)shareInstance;

- (void)addSuspendBallToWindow;
- (void)pushJSErrorTipPanel:(NSString *)bundleName;

- (NSString *)getLocalHost;
- (NSString *)getLocalCodePushKey:(NSString *)bundleName;
@end

NS_ASSUME_NONNULL_END
