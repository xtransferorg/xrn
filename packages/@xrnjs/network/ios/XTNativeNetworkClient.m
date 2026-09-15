/*
 * Copyright (c) XTransfer. All rights reserved.
 *
 * XTNativeNetworkClient 实现：请求拼装、发送、响应解析与错误处理。
 */

#import "XTNativeNetworkClient.h"

#import "XTNativeURLSessionHub.h"

static NSString *const XTNativeNetworkErrorDomain = @"XTNetErrorDomain";
static const NSTimeInterval kXTNativeNetworkDefaultTimeout = 20;

#pragma mark - XTNativeNetworkRequestOptions

@implementation XTNativeNetworkRequestOptions

- (instancetype)init {
  self = [super init];
  if (self) {
    _timeoutInterval = 0;
    _callbackOnMainQueue = NO;
    _validateHTTPStatusCode = YES;
  }
  return self;
}

@end

#pragma mark - XTNativeNetworkClient

@implementation XTNativeNetworkClient

+ (instancetype)sharedClient {
  static XTNativeNetworkClient *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[XTNativeNetworkClient alloc] init];
  });
  return instance;
}

#pragma mark - 请求配置

- (NSTimeInterval)resolvedTimeoutInterval:(XTNativeNetworkRequestOptions *)options {
  if (options != nil && options.timeoutInterval > 0) {
    return options.timeoutInterval;
  }
  return kXTNativeNetworkDefaultTimeout;
}

- (void)applyHeadersToRequest:(NSMutableURLRequest *)request options:(XTNativeNetworkRequestOptions *)options {
  [options.headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSString *value, BOOL *stop) {
    [request setValue:value forHTTPHeaderField:key];
  }];
}

#pragma mark - 对外 API

- (NSURLSessionDataTask *)getJSON:(NSString *)URLString params:(NSDictionary<NSString *, id> *)params options:(XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkJSONCompletion)completion {
  XTNativeNetworkRequestOptions *resolvedOptions = options ?: [XTNativeNetworkRequestOptions new];

  NSURLComponents *components = [NSURLComponents componentsWithString:URLString];
  if (components == nil) {
    [self deliverJSON:nil response:nil error:[XTNativeNetworkClient networkErrorWithMessage:@"Invalid URL" underlyingError:nil] callbackOnMainQueue:resolvedOptions.callbackOnMainQueue completion:completion];
    return nil;
  }

  if (params.count > 0) {
    NSMutableArray<NSURLQueryItem *> *items = [NSMutableArray array];
    [params enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
      [items addObject:[NSURLQueryItem queryItemWithName:key value:[value description]]];
    }];
    components.queryItems = items;
  }

  NSURL *finalURL = components.URL;
  if (finalURL == nil) {
    [self deliverJSON:nil response:nil error:[XTNativeNetworkClient networkErrorWithMessage:@"Invalid URL" underlyingError:nil] callbackOnMainQueue:resolvedOptions.callbackOnMainQueue completion:completion];
    return nil;
  }

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:finalURL];
  request.HTTPMethod = @"GET";

  return [self jsonTaskWithRequest:request options:resolvedOptions completion:completion];
}

- (NSURLSessionDataTask *)postJSON:(NSString *)URLString jsonBody:(id)jsonBody options:(XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkJSONCompletion)completion {
  XTNativeNetworkRequestOptions *resolvedOptions = options ?: [XTNativeNetworkRequestOptions new];

  NSURL *finalURL = [NSURL URLWithString:URLString];
  if (finalURL == nil) {
    [self deliverJSON:nil response:nil error:[XTNativeNetworkClient networkErrorWithMessage:@"Invalid URL" underlyingError:nil] callbackOnMainQueue:resolvedOptions.callbackOnMainQueue completion:completion];
    return nil;
  }

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:finalURL];
  request.HTTPMethod = @"POST";
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];

  if (jsonBody != nil) {
    NSError *encodeError = nil;
    NSData *body = [NSJSONSerialization dataWithJSONObject:jsonBody options:0 error:&encodeError];
    if (encodeError != nil) {
      [self deliverJSON:nil response:nil error:[XTNativeNetworkClient networkErrorWithMessage:@"jsonBody转data异常" underlyingError:nil] callbackOnMainQueue:resolvedOptions.callbackOnMainQueue completion:completion];
      return nil;
    }
    request.HTTPBody = body;
  }

  return [self jsonTaskWithRequest:request options:resolvedOptions completion:completion];
}

- (NSURLSessionDataTask *)dataTaskWithRequest:(NSURLRequest *)request options:(XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkDataCompletion)completion {
  if (request.URL == nil || completion == nil) {
    return nil;
  }

  XTNativeNetworkRequestOptions *resolvedOptions = options ?: [XTNativeNetworkRequestOptions new];
  NSMutableURLRequest *mutableRequest = [request mutableCopy];
  mutableRequest.timeoutInterval = [self resolvedTimeoutInterval:resolvedOptions];
  [self applyHeadersToRequest:mutableRequest options:resolvedOptions];

  BOOL callbackOnMainQueue = resolvedOptions.callbackOnMainQueue;
  BOOL validateHTTPStatusCode = resolvedOptions.validateHTTPStatusCode;

  NSURLSession *session = [XTNativeURLSessionHub sharedHub].sharedSession;
  NSURLSessionDataTask *task = [session dataTaskWithRequest:mutableRequest completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSError *resultError = nil;

    if (error != nil) {
      resultError = [XTNativeNetworkClient mappedNetworkError:error];
    } else if (validateHTTPStatusCode && ![httpResponse isKindOfClass:[NSHTTPURLResponse class]]) {
      resultError = [XTNativeNetworkClient networkErrorWithMessage:@"Invalid response" underlyingError:nil];
    } else if (validateHTTPStatusCode && (httpResponse.statusCode < 200 || httpResponse.statusCode > 299)) {
      NSString *message = [NSString stringWithFormat:@"HTTP ERROR：%ld", (long)httpResponse.statusCode];
      resultError = [XTNativeNetworkClient networkErrorWithMessage:message underlyingError:nil];
    }

    [self deliverData:data response:httpResponse error:resultError callbackOnMainQueue:callbackOnMainQueue completion:completion];
  }];

  [task resume];
  return task;
}

#pragma mark - JSON 请求内部实现

- (NSURLSessionDataTask *)jsonTaskWithRequest:(NSURLRequest *)request options:(XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkJSONCompletion)completion {
  XTNativeNetworkRequestOptions *resolvedOptions = options ?: [XTNativeNetworkRequestOptions new];

  NSURLSession *session = [XTNativeURLSessionHub sharedHub].sharedSession;
  NSMutableURLRequest *mutableRequest = [request mutableCopy];
  mutableRequest.timeoutInterval = [self resolvedTimeoutInterval:resolvedOptions];
  [self applyHeadersToRequest:mutableRequest options:resolvedOptions];

  BOOL callbackOnMainQueue = resolvedOptions.callbackOnMainQueue;
  BOOL validateHTTPStatusCode = resolvedOptions.validateHTTPStatusCode;

  NSURLSessionDataTask *task = [session dataTaskWithRequest:mutableRequest completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;

    if (error != nil) {
      [self deliverJSON:nil response:httpResponse error:[XTNativeNetworkClient mappedNetworkError:error] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    if (validateHTTPStatusCode && ![httpResponse isKindOfClass:[NSHTTPURLResponse class]]) {
      [self deliverJSON:nil response:nil error:[XTNativeNetworkClient networkErrorWithMessage:@"Invalid response" underlyingError:nil] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    if (validateHTTPStatusCode && (httpResponse.statusCode < 200 || httpResponse.statusCode > 299)) {
      NSString *message = [NSString stringWithFormat:@"HTTP ERROR：%ld", (long)httpResponse.statusCode];
      [self deliverJSON:nil response:httpResponse error:[XTNativeNetworkClient networkErrorWithMessage:message underlyingError:nil] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    if (data.length == 0) {
      [self deliverJSON:nil response:httpResponse error:[XTNativeNetworkClient networkErrorWithMessage:@"Empty body" underlyingError:nil] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    NSError *jsonError = nil;
    id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
    if (jsonError != nil) {
      [self deliverJSON:nil response:httpResponse error:[XTNativeNetworkClient networkErrorWithMessage:@"data转json异常" underlyingError:nil] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    if (json == nil || [json isKindOfClass:[NSNull class]]) {
      [self deliverJSON:nil response:httpResponse error:[XTNativeNetworkClient networkErrorWithMessage:@"接口返回 null" underlyingError:nil] callbackOnMainQueue:callbackOnMainQueue completion:completion];
      return;
    }

    [self deliverJSON:json response:httpResponse error:nil callbackOnMainQueue:callbackOnMainQueue completion:completion];
  }];

  [task resume];
  return task;
}

#pragma mark - 回调派发

- (void)deliverData:(NSData *)data response:(NSHTTPURLResponse *)response error:(NSError *)error callbackOnMainQueue:(BOOL)callbackOnMainQueue completion:(XTNativeNetworkDataCompletion)completion {
  if (completion == nil) {
    return;
  }

  void (^block)(void) = ^{
    completion(data, response, error);
  };

  if (callbackOnMainQueue && !NSThread.isMainThread) {
    dispatch_async(dispatch_get_main_queue(), block);
  } else {
    block();
  }
}

- (void)deliverJSON:(id)json response:(NSHTTPURLResponse *)response error:(NSError *)error callbackOnMainQueue:(BOOL)callbackOnMainQueue completion:(XTNativeNetworkJSONCompletion)completion {
  if (completion == nil) {
    return;
  }

  void (^block)(void) = ^{
    completion(json, response, error);
  };

  if (callbackOnMainQueue && !NSThread.isMainThread) {
    dispatch_async(dispatch_get_main_queue(), block);
  } else {
    block();
  }
}

#pragma mark - 错误处理

+ (NSError *)networkErrorWithMessage:(NSString *)message underlyingError:(NSError *)error {
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  userInfo[NSLocalizedDescriptionKey] = message ?: @"未知错误";
  if (error != nil) {
    userInfo[NSUnderlyingErrorKey] = error;
  }
  NSInteger code = error ? error.code : -1;
  return [NSError errorWithDomain:XTNativeNetworkErrorDomain code:code userInfo:userInfo];
}

+ (NSError *)mappedNetworkError:(NSError *)error {
  if (error == nil) {
    return nil;
  }

  switch (error.code) {
    case NSURLErrorTimedOut:
      return [self networkErrorWithMessage:@"请求超时" underlyingError:error];
    case NSURLErrorCannotFindHost:
      return [self networkErrorWithMessage:@"无法找到服务器" underlyingError:error];
    case NSURLErrorNotConnectedToInternet:
      return [self networkErrorWithMessage:@"网络连接不可用" underlyingError:error];
    case NSURLErrorCannotConnectToHost:
      return [self networkErrorWithMessage:@"无法连接到服务器" underlyingError:error];
    default: {
      NSString *desc = [NSString stringWithFormat:@"网络请求失败: %@", error.localizedDescription ?: @"未知错误"];
      return [self networkErrorWithMessage:desc underlyingError:error];
    }
  }
}

@end
