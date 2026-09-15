//
//  XTJSBundleTool.h
//  xtapp
//
//  Created by  xtgq on 2024/1/13.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@class XTJSRuntimeContext;

NS_ASSUME_NONNULL_BEGIN

typedef void(^BundleListBlock)(NSNumber *responseCode, NSDictionary *bundleInfo, NSError *error);

typedef void(^BundleInfoBlock)(BOOL isValid, NSNumber *responseCode, NSDictionary *bundleInfo, NSError *error);

typedef void(^BatchUpdateCheckBlock)(NSNumber *responseCode, NSDictionary * _Nullable batchRes, NSError * _Nullable error);

@interface XTJSBundleTool : NSObject

+ (instancetype)shared;

@property (nonatomic, copy) NSArray *allBundleListData;

@property (nonatomic, assign) BOOL preloadCommonEnabled;
@property (nonatomic, assign) BOOL preloadBundleEnabled;

@property (atomic, copy) NSDictionary *batchUpdateCacheDate;

- (NSString *)getMainBundleName;
- (NSString *)getMainBundlePort;
- (NSString *)getMainBundleDeploymentKey;
- (NSString *)getCommonBundleName;

- (NSArray *)getAllSubBundles;
- (NSArray *)getBundleList;

/// 获取codepush bundle信息
- (NSDictionary *)getCodePushBundleInfos;

- (NSArray *)getAllDevelopmentKey;

/// 获取当前的 Runtime Context
- (nullable XTJSRuntimeContext *)fetchCurrentContext;

/// Swift 友好：从当前 Context 取 NativeModule，避免暴露不完整的 XTJSRuntimeContext 类型。
- (nullable id)moduleFromCurrentContextForClass:(Class)moduleClass;

// 获取当前的module名称
- (NSString *)fetchCurrentModuleName;

// 获取当前的环境
- (NSString *)getEnvName;

// App启动时，预请求bundle列表
- (void)preloadBundleList:(BundleListBlock)completion;

// 路由跳转时，检查bundle信息是否合法
- (void)navigateFetchBundleInfo:(NSString *)bundleName completion:(BundleInfoBlock)completion;

// 保存BundleList数据
- (void)saveBundleList:(NSArray *)bundleList;

// 保存内容到沙盒
- (void)saveJSONObject:(id)obj filename:(NSString *)filename error:(NSError **)error;

// 从沙盒取出存储内容
- (nullable id)loadJSONObjectWithFilename:(NSString *)filename error:(NSError **)error;

- (void)systemMemoryWarning;

- (void)memoryAdd;

- (void)fetchBatchUpdateCheck;

- (void)batchPreDownload:(NSArray *)preDownloadBundles;

- (NSString *)queryDeploymentKey:(NSString *)targetBundleName;

- (NSDictionary *)syncOptions:(NSString *)deploymentKey;

@end

NS_ASSUME_NONNULL_END
