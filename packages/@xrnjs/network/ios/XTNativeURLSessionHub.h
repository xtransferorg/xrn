/*
 * Copyright (c) XTransfer. All rights reserved.
 *
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSNotificationName const XTNetworkMetricsNotification;
FOUNDATION_EXPORT NSString *const XTNetworkTaskMetricsKey;

/// 原生侧共享 NSURLSession 单例 Hub
@interface XTNativeURLSessionHub : NSObject

+ (instancetype)sharedHub;

/// 全进程唯一的 NSURLSession，所有原生 HTTP 请求应通过此 Session 发起
@property (nonatomic, readonly) NSURLSession *sharedSession;

@end

NS_ASSUME_NONNULL_END
