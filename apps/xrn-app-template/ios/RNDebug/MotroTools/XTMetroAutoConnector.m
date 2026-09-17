//
//  XTMetroAutoConnector.m
//  xrngo
//

#import "XTMetroAutoConnector.h"
#import "XTPluginManage.h"
#import "XTJSBundleTool.h"
#import <React/RCTBundleURLProvider.h>

static NSMutableDictionary<NSString *, NSNumber *> *sMetroConnectionCache;
static dispatch_queue_t sMetroConnectionCacheQueue;
static NSString *sCurrentJsLocationBundleName;

@implementation XTMetroAutoConnector

+ (void)initialize {
  if (self == [XTMetroAutoConnector class]) {
    sMetroConnectionCache = [NSMutableDictionary dictionary];
    sMetroConnectionCacheQueue = dispatch_queue_create("com.xt.metro.connection.cache", DISPATCH_QUEUE_SERIAL);
  }
}

+ (BOOL)checkMetroConnection:(NSString *)bundleName {
  if (bundleName.length == 0) {
    return NO;
  }
  NSString *port = [self portForBundleName:bundleName];
  if (port.length == 0) {
    return NO;
  }

  __block NSNumber *cachedResult = nil;
  dispatch_sync(sMetroConnectionCacheQueue, ^{
    cachedResult = sMetroConnectionCache[bundleName];
  });
  if (cachedResult != nil) {
    return cachedResult.boolValue;
  }

  BOOL isConnected = [self pingMetroOnPort:port];
  dispatch_sync(sMetroConnectionCacheQueue, ^{
    sMetroConnectionCache[bundleName] = @(isConnected);
  });
  return isConnected;
}

+ (BOOL)pingMetroOnPort:(NSString *)port {
  __block BOOL isConnection = NO;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  NSString *host = [[XTPluginManage shareInstance] getLocalHost];
  if (host.length == 0) {
    return NO;
  }
  NSString *urlString = [NSString stringWithFormat:@"http://%@:%@/status", host, port];
  NSURL *metroURL = [NSURL URLWithString:urlString];
  if (!metroURL) {
    return NO;
  }

  NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
  config.timeoutIntervalForRequest = 5.0;
  // 显式用独立队列，避免 completion 被派到主队列时与主线程上的 semaphore wait 死锁
  NSOperationQueue *queue = [[NSOperationQueue alloc] init];
  queue.maxConcurrentOperationCount = 1;
  NSURLSession *session = [NSURLSession sessionWithConfiguration:config delegate:nil delegateQueue:queue];

  NSURLSessionDataTask *task = [session dataTaskWithURL:metroURL
                                      completionHandler:^(NSData *_Nullable data, NSURLResponse *_Nullable response, NSError *_Nullable error) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    if (!error && httpResponse && httpResponse.statusCode == 200) {
      isConnection = YES;
    }
    dispatch_semaphore_signal(semaphore);
  }];
  if (!task) {
    return NO;
  }
  [task resume];

  dispatch_time_t deadline = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC));
  long waitResult = dispatch_semaphore_wait(semaphore, deadline);
  if (waitResult != 0) {
    [task cancel];
    return NO;
  }
  return isConnection;
}

+ (void)updateJsLocationForBundleName:(NSString *)bundleName {
  if (bundleName.length == 0 || ![self checkMetroConnection:bundleName]) {
    return;
  }
  if ([sCurrentJsLocationBundleName isEqualToString:bundleName]) {
    return;
  }
  sCurrentJsLocationBundleName = [bundleName copy];
  [[RCTBundleURLProvider sharedSettings] setJsLocation:[self jsLocationStringForBundleName:bundleName]];
}

+ (NSString *)jsLocationStringForBundleName:(NSString *)bundleName {
  NSString *host = [[XTPluginManage shareInstance] getLocalHost];
  NSString *port = [self portForBundleName:bundleName];
  return [NSString stringWithFormat:@"%@:%@", host, port];
}

+ (NSString *)portForBundleName:(NSString *)bundleName {
  if (bundleName.length == 0) {
    return @"8081";
  }
  NSArray *bundleList = [[XTJSBundleTool shared] getBundleList];
  for (NSDictionary *bundleInfo in bundleList) {
    if ([bundleInfo[@"bundleName"] isEqualToString:bundleName]) {
      NSString *port = bundleInfo[@"port"];
      if ([port isKindOfClass:[NSString class]] && port.length > 0) {
        return port;
      }
      break;
    }
  }
  return @"8081";
}

@end
