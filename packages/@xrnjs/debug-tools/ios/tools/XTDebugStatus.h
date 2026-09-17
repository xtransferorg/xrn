//
//  XTDebugStatus.h
//  xtapp
//
//  Created by  xupeng on 2025/11/17.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTDebugStatus : NSObject

@property (class, nonatomic, readonly) XTDebugStatus *shared;

/// 获取bundle Debug调试状态
- (BOOL)getDebugStatus:(NSString *)bundleName;

/// 获取bundle Common调试状态
- (BOOL)getCommonStatus:(NSString *)bundleName;

/// 获取bundle Codepush调试状态
- (BOOL)getCodepushStatus:(NSString *)bundleName;

/// 获取bundle 全部调试状态
- (NSDictionary<NSString *, id> *)getDebugInfo:(NSString *)bundleName;

/// 保存bundle 全部调试状态
- (void)saveDebugInfo:(NSString *)bundleName debugInfo:(NSDictionary<NSString *, id> *)debugInfo;

/// 清除bundle 调试状态
- (void)cleanDebugInfo:(NSString *)bundleName;

@end

NS_ASSUME_NONNULL_END
