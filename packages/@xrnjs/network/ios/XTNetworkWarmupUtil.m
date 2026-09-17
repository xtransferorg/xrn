//
//  XTNetworkWarmupUtil.m
//  xtapp
//

#import "XTNetworkWarmupUtil.h"
#import "XTNativeNetworkClient.h"


static NSString *XTWarmupURLStringWithTrailingSlash(NSString *urlString) {
  if (!urlString.length) {
    return urlString;
  }
  if ([urlString hasSuffix:@"/"]) {
    return urlString;
  }
  return [urlString stringByAppendingString:@"/"];
}

@interface XTNetworkWarmupUtil ()

@property (nonatomic, assign) BOOL nativeWarmupStarted;
@property (nonatomic, copy) NSArray<NSString *> *nativeWarmupURLStrings;

@end

@implementation XTNetworkWarmupUtil

+ (instancetype)shared {
  static XTNetworkWarmupUtil *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[XTNetworkWarmupUtil alloc] init];
  });
  return instance;
}

- (void)setNativeWarmupURLStrings:(NSArray<NSString *> *)nativeURLStrings {
  NSMutableArray<NSString *> *normalizedNative = [NSMutableArray arrayWithCapacity:nativeURLStrings.count];
  for (NSString *urlString in nativeURLStrings) {
    [normalizedNative addObject:XTWarmupURLStringWithTrailingSlash(urlString)];
  }
  self.nativeWarmupURLStrings = [normalizedNative copy];
}

/// 执行 Native 网络预热。
- (void)performNativeWarmupIfNeeded {
  if (self.nativeWarmupStarted) {
    return;
  }
  self.nativeWarmupStarted = YES;

  for (NSString *urlString in self.nativeWarmupURLStrings) {
    [self startNativeWarmupForURL:urlString];
  }
}

- (void)startNativeWarmupForURL:(NSString *)urlString {
  NSURL *url = [NSURL URLWithString:urlString];
  if (url == nil) {
    return;
  }

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  request.HTTPMethod = @"HEAD";
  request.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;

  XTNativeNetworkRequestOptions *options = [XTNativeNetworkRequestOptions new];
  options.timeoutInterval = 5.0;
  options.validateHTTPStatusCode = NO;
  options.callbackOnMainQueue = NO;

  [[XTNativeNetworkClient sharedClient] dataTaskWithRequest:request options:options completion:^(NSData * _Nullable data, NSHTTPURLResponse * _Nullable response, NSError * _Nullable error) {
    
  }];
}

@end
