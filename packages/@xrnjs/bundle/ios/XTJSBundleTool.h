//
//  XTJSBundleTool.h
//  xtapp
//
//  Created by  xtgq on 2024/1/13.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
NS_ASSUME_NONNULL_BEGIN

@interface XTJSBundleTool : NSObject

+ (instancetype)shared;

- (NSString *)getMainBundleName;
- (NSString *)getMainBundlePort;
- (NSString *)getCommonBundleName;

- (NSArray *)getAllSubBundles;
- (NSArray *)getAllBundleInfo;
- (NSArray *)getAllDevelopmentKey;

/// 获取当前的bridge实例
- (RCTBridge *)fetchCurrentBridge;

// 获取当前的module名称
- (NSString *)fetchCurrentModuleName;

@end

NS_ASSUME_NONNULL_END
