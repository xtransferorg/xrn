//
//  NavigationAction.h
//  xtapp
//
//  Created by  xtgq on 2025/5/6.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NavigationAction : NSObject

+ (instancetype)shared;

- (void)setNavigationKey:(NSString *)key;
- (void)setNavigationState:(NSString *)state;
- (void)dispatchAction:(NSString *)action;

@end

NS_ASSUME_NONNULL_END
