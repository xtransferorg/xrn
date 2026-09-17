//
//  XTBundlePreloadQueue.h
//  react-native-xrn-multi-bundle
//
//  Created by  xtgq on 2026/1/16.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTBundlePreloadQueue : NSObject

+ (instancetype)shared;

- (void)enqueuePreloadTask:(NSString *)bundleName;

- (void)enqueuePreloadTasks:(NSArray<NSString *> *)bundleNames;

- (void)start;

- (void)clear;

@property (nonatomic, assign, readonly) BOOL isExecuting;

@property (nonatomic, copy, readonly, nullable) NSString *currentLoadingBundle;

@property (nonatomic, assign, readonly) NSUInteger remainingTaskCount;

/// 超时时间（秒），默认 30 秒
@property (nonatomic, assign) NSTimeInterval timeoutInterval;

@end

NS_ASSUME_NONNULL_END
