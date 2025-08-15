//
//  XTViewControllerProtocol.h
//  xtapp
//
//  Created by liyuan on 2024/1/15.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

#ifndef XTViewControllerProtocol_h
#define XTViewControllerProtocol_h

NS_ASSUME_NONNULL_BEGIN

@protocol XTViewControllerProtocol <NSObject>

@property (nonatomic, readonly, strong) RCTBridge *bridge;
@property (nonatomic, readonly, copy) NSString *moduleName;
@property (nonatomic, readonly, copy) NSDictionary *initialProperties;

@required
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties;
@end

NS_ASSUME_NONNULL_END

#endif /* XTViewControllerProtocol_h */
