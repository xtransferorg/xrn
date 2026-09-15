/*
 * Copyright (c) XTransfer. All rights reserved.
 *
 * XTNativeURLSessionHub 实现：单例 Session 创建 + metrics 通知派发。
 */

#import "XTNativeURLSessionHub.h"

NSNotificationName const XTNetworkMetricsNotification = @"XTNetworkMetricsNotification";
NSString *const XTNetworkTaskMetricsKey = @"taskMetrics";

@interface XTNativeURLSessionHub () <NSURLSessionTaskDelegate>

@property (nonatomic, readwrite) NSURLSession *sharedSession;

@end

@implementation XTNativeURLSessionHub

+ (instancetype)sharedHub {
  static XTNativeURLSessionHub *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[XTNativeURLSessionHub alloc] init];
  });
  return instance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    // default 配置 + 不等待网络恢复；超时由 XTNativeNetworkClient 按请求设置，Hub 不干预
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    configuration.waitsForConnectivity = NO;
    self.sharedSession = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
  }
  return self;
}

#pragma mark - NSURLSessionTaskDelegate

// 请求结束时收集性能数据，通知 XTNetworkMetricsManager 处理（Sentry 上报等）
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didFinishCollectingMetrics:(NSURLSessionTaskMetrics *)metrics {
  if (metrics == nil) {
    return;
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:XTNetworkMetricsNotification object:task userInfo:@{XTNetworkTaskMetricsKey : metrics}];
}

@end
