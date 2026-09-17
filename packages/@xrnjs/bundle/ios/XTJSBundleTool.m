//
//  XTJSBundleTool.m
//  xtapp
//
//  Created by  xtgq on 2024/1/13.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTJSBundleTool.h"
#import "RNCConfig.h"
#import "XTBaseBundleViewController.h"
#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"
#import "CodePush+XTBundleInfo.h"
#import "XTNativeNetworkClient.h"
#import "XTFileStoreTool.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <CodePush/CodePush.h>
#import "CodePushManager.h"
#import "CodePushCoordinator.h"

@interface XTJSBundleTool ()

@property (nonatomic, strong) NSMutableArray <NSMutableData *>*testDataArray;
@property (nonatomic, strong) NSMutableDictionary<NSString *, CodePushManager *> *inflightPreDownloadManagers;
@end

@implementation XTJSBundleTool

+ (instancetype)shared {
	static XTJSBundleTool *shareInstance;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		shareInstance = [[XTJSBundleTool alloc] init];

		shareInstance.preloadCommonEnabled = YES;
		shareInstance.preloadBundleEnabled = YES;
		
		shareInstance.testDataArray = [NSMutableArray array];
    shareInstance.inflightPreDownloadManagers = [NSMutableDictionary dictionary];
	});
	return shareInstance;
}

- (NSString *)getMainBundleName {
	NSString *value = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundleName"];
	return value;
}

- (NSString *)getMainBundlePort {
	NSString *value = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainBundlePort"];
	return value;
}

- (NSString *)getMainBundleDeploymentKey {
	NSString *deploymentKey = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CodePushDeploymentKey"];
	return deploymentKey;
}

- (NSString *)getCommonBundleName {
	NSString *value = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CommonBundleName"];
	return value;
}

- (NSArray *)getAllSubBundles {
	NSBundle *mainBundle = [NSBundle mainBundle];
	NSString *plistPath = [mainBundle pathForResource:@"xtBundles" ofType:@"plist"];
	NSArray <NSDictionary <NSString *, id>*>*xtBundlesArray = [NSArray arrayWithContentsOfFile:plistPath];
	
	NSMutableArray *mutArr = [NSMutableArray array];
	for (NSDictionary *item in xtBundlesArray) {
		NSMutableDictionary *muDic = [NSMutableDictionary dictionaryWithDictionary:item];
		[muDic setObject:@"INNER" forKey:@"deliveryType"];
		[mutArr addObject:muDic];
	}
	
	NSArray *dynamicBundleList = XTJSBundleTool.shared.allBundleListData;
	
	for (NSDictionary *item in dynamicBundleList) {
		NSString *deliveryType = item[@"deliveryType"];
		
		if ([deliveryType isEqualToString:@"DYNAMIC"]) {
			NSMutableDictionary *muDic = [NSMutableDictionary dictionary];
			[muDic setObject:item[@"bundleName"] forKey:@"jsBundleName"];
			[muDic setObject:item[@"deploymentKey"] forKey:@"codePushKey"];
			[muDic setObject:@"" forKey:@"port"];
			[muDic setObject:@"DYNAMIC" forKey:@"deliveryType"];
			[mutArr addObject:muDic];
		}
	}
	
	return mutArr.copy;
}

- (NSArray *)getBundleList {
	NSMutableArray *bundles = [NSMutableArray array];
	[bundles addObject:@{@"bundleName":[self getMainBundleName], @"port":[self getMainBundlePort], @"deliveryType": @"INNER"}];
	
	NSArray *subBundles = [self getAllSubBundles];
	for (NSInteger i = 0; i < subBundles.count; i++) {
		NSDictionary *item = subBundles[i];
		[bundles addObject:@{@"bundleName":item[@"jsBundleName"], @"port":item[@"port"], @"deliveryType": item[@"deliveryType"]}];
	}
	
	return bundles.copy;
}

- (NSDictionary *)getCodePushBundleInfos {
	NSMutableDictionary *metaData = [[NSMutableDictionary alloc] init];
	NSMutableArray *bundleInfoList = [[NSMutableArray alloc] init];
	NSArray *developmentKeyList = [[XTJSBundleTool shared] getAllDevelopmentKey];
	for (NSDictionary *item in developmentKeyList) {
	  NSString *bundleName = item[@"bundleName"];
	  NSString *deploymentKey = item[@"deploymentKey"];
	  NSError *error;
	  BOOL currentUpdateIsPending = false;
	  
	  NSDictionary *currentPackage = [CodePush getPackageForDeploymentKey:deploymentKey error:&error];
	  currentPackage = currentPackage ?: @{};
	  if (deploymentKey && deploymentKey.length > 0) {
		NSString *packageHash = currentPackage[@"packageHash"];
		currentUpdateIsPending = [self isPendingUpdate:packageHash deploymentKey:deploymentKey];
	  }
	  
	  NSDictionary *resultInfo = currentPackage;
	  if (currentUpdateIsPending) {
		NSError *error;
		resultInfo = [CodePush getPreviousPackageForDeploymentKey:deploymentKey error:&error];
		resultInfo = resultInfo ?: @{};
	  }
	  
	  NSMutableDictionary *dic = [[NSMutableDictionary alloc] init];
	  [dic setObject:resultInfo forKey:@"codePushPackage"];
	  [dic setObject:bundleName forKey:@"bundleName"];
	  [bundleInfoList addObject:dic];
	}
	[metaData setObject:bundleInfoList forKey:@"bundleInfoList"];
	return metaData;
}

- (NSArray *)getAllDevelopmentKey {
	NSMutableArray *bundles = [NSMutableArray array];

	NSString *mainKey = [self getDevelopmentKeyWith:[self getMainBundleName] defaultDeploymentKey:[self getMainBundleDeploymentKey]];
	[bundles addObject:@{@"bundleName":[self getMainBundleName], @"deploymentKey":mainKey}];
	
	NSArray *subBundles = [self getAllSubBundles];
	for (NSInteger i = 0; i < subBundles.count; i++) {
		NSDictionary *item = subBundles[i];
		NSString *deploymentKey = [self getDevelopmentKeyWith:item[@"jsBundleName"] defaultDeploymentKey:item[@"codePushKey"]];
		[bundles addObject:@{@"bundleName":item[@"jsBundleName"], @"deploymentKey":deploymentKey}];
	}
	return bundles.copy;
}

- (XTJSRuntimeContext *)fetchCurrentContext {
	XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
	UIViewController *topStackVC = nav.viewControllers.lastObject;
	
	if ([topStackVC isKindOfClass:[XTBaseBundleViewController class]]) {
		return ((XTBaseBundleViewController *)topStackVC).runtimeContext;
	}
	return nil;
}

- (nullable id)moduleFromCurrentContextForClass:(Class)moduleClass {
	return [[self fetchCurrentContext] moduleForClass:moduleClass];
}


- (NSString *)fetchCurrentModuleName {
	NSString *currentModule = nil;
	
	XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
	UIViewController *topStackVC = nav.viewControllers.lastObject;
	
	if ([topStackVC isKindOfClass:[XTBaseBundleViewController class]]) {
		XTBaseBundleViewController *bundleVC = (XTBaseBundleViewController *)topStackVC;
		currentModule = bundleVC.moduleName;
	}
	return currentModule;
}

- (NSString *)getDevelopmentKeyWith:(NSString *)bundleName defaultDeploymentKey:(NSString *)deploymentKey {
	NSString *codepushKey = deploymentKey;
	NSString *localCodePsuhKey = [self getLocalCodePushKey:bundleName];
	if (![self isProdEnv] && localCodePsuhKey) {
		codepushKey = localCodePsuhKey;
	}
	return codepushKey;
}

- (NSString *)getLocalCodePushKey:(NSString *)bundleName {
	NSString *key = [NSString stringWithFormat:@"%@-codepush-key", bundleName];
	NSString *localCodePsuhKey = [[NSUserDefaults standardUserDefaults] objectForKey:key];
	return localCodePsuhKey;
}

- (BOOL)isProdEnv {
	NSString *envName = [RNCConfig envFor:@"ENV_NAME"];
	return [envName isEqualToString:@"prod"];
}

- (BOOL)isPendingUpdate:(NSString*)packageHash deploymentKey:(NSString *)deploymentKey
{
	NSString *PendingUpdateKey = @"CODE_PUSH_PENDING_UPDATE";
	NSString *PendingUpdateIsLoadingKey = @"isLoading";
	NSString *PendingUpdateHashKey = @"hash";
	NSUserDefaults *preferences = [[NSUserDefaults alloc] initWithSuiteName:deploymentKey];
	NSDictionary *pendingUpdate = [preferences objectForKey:PendingUpdateKey];

	// If there is a pending update whose "state" isn't loading, then we consider it "pending".
	// Additionally, if a specific hash was provided, we ensure it matches that of the pending update.
	BOOL updateIsPending = pendingUpdate &&
						   [pendingUpdate[PendingUpdateIsLoadingKey] boolValue] == NO &&
						   (!packageHash || [pendingUpdate[PendingUpdateHashKey] isEqualToString:packageHash]);

	return updateIsPending;
}

- (void)preloadBundleList:(BundleListBlock)completion {
	NSString *serverURL = [self getCodepushServerUrl];
	if (serverURL.length == 0) {
		completion(@(-1), @{}, [NSError errorWithDomain:@"XRNCodePush" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"CodePushServerURL is not configured"}]);
		return;
	}
	NSString *url = [NSString stringWithFormat:@"%@apps/getBundleList", serverURL];
	
	NSDictionary *params = @{@"platform": @"ios",
													 @"env": [self getEnvName],
													 @"buildType": [self getBuildType]};

	XTNativeNetworkRequestOptions *options = [XTNativeNetworkRequestOptions new];
	options.timeoutInterval = 5;
	options.callbackOnMainQueue = YES;
	[[XTNativeNetworkClient sharedClient] postJSON:url jsonBody:params options:options completion:^(NSDictionary * _Nullable res, NSHTTPURLResponse * _Nullable resp, NSError * _Nullable err) {
			NSLog(@"getBundleList res: %@", res);
			
			NSNumber *codeNum = @(-1);
			if ([res isKindOfClass:[NSDictionary class]]) {
				codeNum = res[@"code"];
			}
		
			NSError *error = nil;
			NSArray *cacheList = [self loadJSONObjectWithFilename:@"bundles.json" error:&error];
		
			if ([codeNum integerValue] == 0) {
				NSArray *list = res[@"data"];
				[self saveBundleList:list.count > 0 ? list : cacheList];
			} else {
				[self saveBundleList:cacheList];
			}
		
			completion(codeNum, res, err);
	}];
	
}

- (void)fetchBatchUpdateCheck {
	NSArray *subBundles = [self getAllSubBundles];
	NSLog(@"subBundles：%@", subBundles);
	
	NSString *appVersion = @"";
	NSString *clientUniqueId = @"";
	
	NSMutableArray *batchUpdateArr = [NSMutableArray array];
	for (NSDictionary *bundleInfo in subBundles) {
		NSString *bundleName = bundleInfo[@"jsBundleName"];
		NSString *deploymentKey = [self getDevelopmentKeyWith:bundleName defaultDeploymentKey:bundleInfo[@"codePushKey"]];
		CPLog(@"deploymentKey：%@", deploymentKey);
		
		CodePush *codepush = [[CodePush alloc] initWithDeploymentKey:deploymentKey isPreDownload:YES];
		CPLog(@"codepush:%@", codepush);
		
		NSURL *bizBundleURL = [codepush bundleURLForResource:bundleName];
		CPLog(@"bizBundleURL：%@", bizBundleURL);
		
		NSError *error;
		NSDictionary *currentPackage = [codepush.package getCurrentPackage:&error];
		CPLog(@"currentPackage：%@", currentPackage);
		
		NSString *label = currentPackage[@"label"] ?: @"";
		NSString *packageHash = currentPackage[@"packageHash"] ?: @"";
		
		CodePushConfig *config = codepush.config;
		appVersion = config.appVersion ?: @"";
		clientUniqueId = config.clientUniqueId ?: @"";
		
		NSString *basePackageHash = [config getBaseHashWithDeploymentKey:deploymentKey] ?: @"";
		NSString *commonHash = config.commonHash ?: @"";
		
		NSMutableDictionary *item = [NSMutableDictionary dictionary];
		[item setValue:deploymentKey forKey:@"deploymentKey"];
		[item setValue:label forKey:@"label"];
		[item setValue:packageHash forKey:@"packageHash"];
		[item setValue:basePackageHash forKey:@"basePackageHash"];
		[item setValue:commonHash forKey:@"commonHash"];
		
		CPLog(@"itemData：%@", item);
		[batchUpdateArr addObject:item];
	}
	
	CPLog(@"batchUpdateArr：%@", batchUpdateArr);
	
	[self fetchBatchUpdateCheck:appVersion clientUniqueId:clientUniqueId items:batchUpdateArr completion:^(NSNumber * _Nonnull responseCode, NSDictionary * _Nonnull batchRes, NSError * _Nonnull error) {
		
	}];
}

- (void)fetchBatchUpdateCheck:(NSString *)appVersion clientUniqueId:(NSString *)clientUniqueId items:(NSArray *)items completion:(BatchUpdateCheckBlock)completion {
	CPLog(@"appVersion：%@", appVersion);
	CPLog(@"clientUniqueId：%@", clientUniqueId);
	CPLog(@"items：%@", items);
    
	if (items.count == 0) {
		return;
	}
	NSString *serverURL = [self getCodepushServerUrl];
	if (serverURL.length == 0) {
		completion(@(-1), nil, [NSError errorWithDomain:@"XRNCodePush" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"CodePushServerURL is not configured"}]);
		return;
	}
	NSString *url = [NSString stringWithFormat:@"%@batchUpdateCheck", serverURL];
	CPLog(@"url：%@", url);
	
	NSDictionary *params = @{@"appVersion": appVersion,
													 @"clientUniqueId": clientUniqueId,
													 @"items": items};
	CPLog(@"params：%@", params);
	
//	NSMutableDictionary *itemsObj = [NSMutableDictionary dictionary];
//	for (NSDictionary *item in items) {
//		[itemsObj setValue:item forKey:item[@"deploymentKey"]];
//	}
	
//	CPLog(@"itemsObj：%@", itemsObj);
	
	XTNativeNetworkRequestOptions *options = [XTNativeNetworkRequestOptions new];
	options.timeoutInterval = 5;
	options.callbackOnMainQueue = YES;
	[[XTNativeNetworkClient sharedClient] postJSON:url jsonBody:params options:options completion:^(NSDictionary * _Nullable res, NSHTTPURLResponse * _Nullable resp, NSError * _Nullable err) {
		CPLog(@"batchUpdateCheck res: %@", res);
		
		if (res && [res isKindOfClass:[NSDictionary class]]) {
			NSArray *updateInfos = res[@"updateInfos"];
			
			NSMutableDictionary *cacheDic = [NSMutableDictionary dictionary];
			NSNumber *cachedAt = @(XT_RUNTIME_CURRENT_TIMESTAMP_MS);
			for (NSDictionary *info in updateInfos) {
				NSString *deploymentKey = info[@"deploymentKey"];
				NSDictionary *updateInfo = info[@"updateInfo"];
                
				updateInfo = [updateInfo isKindOfClass:[NSDictionary class]] ? updateInfo : @{};
                
                NSMutableDictionary *newUpdateInfo = [NSMutableDictionary dictionaryWithDictionary:updateInfo];
                [newUpdateInfo setValue:deploymentKey ?: @"" forKey:@"deploymentKey"];
                CPLog(@"newUpdateInfo：%@", newUpdateInfo);
                
                if (updateInfo.allKeys.count > 0 && deploymentKey) {
                    [cacheDic setValue:@{@"result": newUpdateInfo, @"cachedAt": cachedAt} forKey:deploymentKey];
                }
			}
			
			CPLog(@"saveDic：%@", cacheDic);
			self.batchUpdateCacheDate = cacheDic.copy ?: @{};
			completion(@(0), res, err);
			return;
		}
		
		completion(@(-1), res, err);
	}];
}

- (void)batchPreDownload:(NSArray *)preDownloadBundles {
	NSThread *currentThread = [NSThread currentThread];
	CPLog(@"currentThread：%@", currentThread);
	
	if (![NSThread isMainThread]) {
		return;
	}
	
	for (NSString *bundleName in preDownloadBundles) {
		NSString *targetDeploymentKey = [self queryDeploymentKey:bundleName];
        if (targetDeploymentKey.length > 0) {
            [self preDownload:bundleName deploymentKey:targetDeploymentKey];
        }
	}
}

- (void)preDownload:(NSString *)bundleName deploymentKey:(NSString *)deploymentKey {
	
	BOOL acquired = [[CodePushCoordinator shared] acquireForKey:deploymentKey waiter:nil];
	if (!acquired) {
		CPLog(@"preDownload: bundle=%@ deploymentKey=%@ 已有 checkAndDownload流程 在执行，跳过本次流程", bundleName, deploymentKey);
		return;
	}
	
	CodePush *codepush = [[CodePush alloc] initWithDeploymentKey:deploymentKey isPreDownload:YES];
	NSURL *bizBundleURL = [codepush bundleURLForResource:bundleName];
	CPLog(@"bizBundleURL：%@", bizBundleURL);
	
	CodePushManager *codepushManager = [[CodePushManager alloc] initWithCodePush:codepush];
  self.inflightPreDownloadManagers[deploymentKey] = codepushManager;
	
	NSDictionary *options = [self syncOptions:deploymentKey];
    
  __weak typeof(self) weakSelf = self;
	[codepushManager checkAndDownload:options isPreDownload:YES statusChanged:^(CodePushSyncStatus syncStatus, NSDictionary * _Nullable package, NSError * _Nullable error) {
	} downloadProgress:^(NSUInteger receivedBytes, NSUInteger totalBytes, NSString * _Nonnull progress, NSDictionary * _Nullable package) {
	} binaryVersionMismatch:^(NSDictionary * _Nullable updateInfo) {
	} syncCompletion:^(CodePushSyncStatus syncStatus, NSError * _Nullable error) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
        
		CPLog(@"preDownload syncCompletion: bundle=%@ key=%@ status=%ld error=%@",
			  bundleName, deploymentKey, (long)syncStatus, error);
		[[CodePushCoordinator shared] finishForKey:deploymentKey syncStatus:syncStatus error:error];
    
		dispatch_async(dispatch_get_main_queue(), ^{
				if (strongSelf.inflightPreDownloadManagers[deploymentKey] == codepushManager) {
						[strongSelf.inflightPreDownloadManagers removeObjectForKey:deploymentKey];
				}
		});
	}];
	
}

- (NSString *)queryDeploymentKey:(NSString *)targetBundleName {
	NSArray *allDeploymentKey = [self getAllDevelopmentKey];
	NSString *deploymentKey;
	
	for (NSDictionary *info in allDeploymentKey) {
		NSString *bundleName = info[@"bundleName"];
		if ([bundleName isEqualToString:targetBundleName]) {
			deploymentKey = info[@"deploymentKey"];
			break;
		}
	}
	
	return deploymentKey;
}

- (NSDictionary *)syncOptions:(NSString *)deploymentKey {
	NSDictionary *options = @{
		@"deploymentKey": deploymentKey,
		@"installMode": @(CodePushInstallModeOnNextRestart),
		@"mandatoryInstallMode": @(CodePushInstallModeImmediate),
		@"rollbackRetryOptions": @{@"delayInHours": @(1), @"maxRetryAttempts": @(6)}
	};
	return options;
}

- (void)saveBundleList:(NSArray *)bundleList {
	
	if (!bundleList || ![bundleList isKindOfClass:[NSArray class]]) {
		bundleList = @[];
	}
	
	NSBundle *mainBundle = [NSBundle mainBundle];
	NSString *plistPath = [mainBundle pathForResource:@"xtBundles" ofType:@"plist"];
	NSArray <NSDictionary <NSString *, id>*>*xtBundlesArray = [NSArray arrayWithContentsOfFile:plistPath];
	
	NSMutableArray *mutArr = [NSMutableArray array];
	
	[mutArr addObject:@{@"bundleName":[self getMainBundleName], @"deploymentKey":[self getMainBundleDeploymentKey], @"port":[self getMainBundlePort], @"deliveryType": @"INNER"}];
	
	for (NSDictionary *item in xtBundlesArray) {
		NSMutableDictionary *muDic = [NSMutableDictionary dictionary];
		
		[muDic setValue:item[@"jsBundleName"] forKey:@"bundleName"];
		[muDic setValue:item[@"codePushKey"] forKey:@"deploymentKey"];
		[muDic setValue:item[@"port"] forKey:@"port"];
		[muDic setValue:@"INNER" forKey:@"deliveryType"];
		[mutArr addObject:muDic];
	}
	
	for (NSDictionary *item in bundleList) {
		NSString *deliveryType = item[@"deliveryType"];
		
		if ([deliveryType isEqualToString:@"DYNAMIC"]) {
			
			NSString *bundleName = item[@"bundleName"];
			NSDictionary *debugInfo = [self getDebugInfo:bundleName];
			NSString *bundlePort = debugInfo[@"port"] ?: item[@"port"];
			
			NSMutableDictionary *muDic = [NSMutableDictionary dictionaryWithDictionary:item];
			[muDic removeObjectForKey:@"codePushName"];
			[muDic setObject:bundlePort ?: @"" forKey:@"port"];
			[mutArr addObject:muDic];
		}
	}
	
	self.allBundleListData = mutArr.copy;
	
	NSError *err;
	[XTFileStoreTool saveJSONObject:self.allBundleListData filename:@"bundles.json" error:&err];
}

- (void)navigateFetchBundleInfo:(NSString *)bundleName completion:(nonnull BundleInfoBlock)completion {
	NSString *serverURL = [self getCodepushServerUrl];
	if (serverURL.length == 0) {
		completion(NO, @(-1), @{}, [NSError errorWithDomain:@"XRNCodePush" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"CodePushServerURL is not configured"}]);
		return;
	}
	NSString *url = [NSString stringWithFormat:@"%@apps/getBundleInfo", serverURL];
	
	NSDictionary *params = @{@"platform": @"ios",
													 @"env": [self getEnvName],
													 @"buildType": [self getBuildType],
													 @"bundleName": bundleName};

	XTNativeNetworkRequestOptions *options = [XTNativeNetworkRequestOptions new];
	options.timeoutInterval = 5;
	options.callbackOnMainQueue = YES;
	[[XTNativeNetworkClient sharedClient] postJSON:url jsonBody:params options:options completion:^(NSDictionary * _Nullable res, NSHTTPURLResponse * _Nullable resp, NSError * _Nullable err) {
		NSLog(@"getBundleInfo res: %@", res);
		
		BOOL isAvailable = false;
		NSDictionary *bundleInfo = @{};
		NSNumber *codeNum = @(-1);
		
		if ([res isKindOfClass:[NSDictionary class]]) {
			codeNum = res[@"code"];
		}
		
		if ([codeNum integerValue] == 0 && [res[@"data"] isKindOfClass:[NSDictionary class]]) {
			isAvailable = true;
			bundleInfo = res[@"data"];
			[self handleBundleInfo:bundleInfo];
		}
		
		completion(isAvailable, codeNum, bundleInfo, err);
	}];
	
}

- (void)handleBundleInfo:(NSDictionary *)bundleInfo {
	
	BOOL isDynamic = [bundleInfo[@"deliveryType"] isEqualToString:@"DYNAMIC"];
	if (isDynamic) {
		BOOL isExists = NO;
		NSLog(@"self.allBundleListData：%@", self.allBundleListData);
		for (NSDictionary *item in self.allBundleListData) {
			if ([item[@"bundleName"] isEqualToString:bundleInfo[@"bundleName"]]) {
				isExists = YES;
				break;
			}
		}
		
		if (!isExists) {
			NSMutableArray *arr = [NSMutableArray arrayWithArray:self.allBundleListData];
			
			NSString *bundleName = bundleInfo[@"bundleName"];
			NSDictionary *debugInfo = [self getDebugInfo:bundleName];
			NSString *port = debugInfo[@"port"] ?: @"";
			
			NSMutableDictionary *muDic = [NSMutableDictionary dictionaryWithDictionary:bundleInfo];
			[muDic removeObjectForKey:@"codePushName"];
			[muDic setObject:port forKey:@"port"];
			
			[arr addObject:muDic.copy];
			
			self.allBundleListData = arr.copy;
			
			NSError *error = nil;
			[XTFileStoreTool saveJSONObject:self.allBundleListData filename:@"bundles.json" error:&error];
		}
	}
}

- (nullable id)loadJSONObjectWithFilename:(NSString *)filename error:(NSError **)error {
	id res = [XTFileStoreTool loadJSONObjectWithFilename:filename error:error];
	NSLog(@"res: %@", res);
	return res;
}

- (void)saveJSONObject:(id)obj filename:(NSString *)filename error:(NSError *__autoreleasing  _Nullable *)error {
	[XTFileStoreTool saveJSONObject:obj filename:filename error:error];
}

- (NSString *)getEnvName {
	NSString *envName = [RNCConfig envFor:@"ENV_NAME"] ?: @"prod";
	
	if ([envName isEqualToString:@"prod"]) {
		return envName;
	}
	
	NSString *localEnvName = [[NSUserDefaults standardUserDefaults] objectForKey:@"DEV_ENV_NAME"];
	
	return localEnvName ?: envName;
}

- (NSString *)getBuildType {
	NSString *buildType = @"release";
	
#if DEBUG
	buildType = @"debug";
#endif
	
	return buildType;
}

- (NSString *)getCodepushServerUrl {
	NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
	NSString *serverURL = [infoDictionary objectForKey:@"CodePushServerURL"];
	if (serverURL.length == 0 || [serverURL isEqualToString:@"undefined"]) {
		return nil;
	}
	
	if ([serverURL hasSuffix:@"/"]) {
		return serverURL;
	} else {
		return [serverURL stringByAppendingString:@"/"];
	}
	
}

- (NSDictionary<NSString *, id> *)getDebugInfo:(NSString *)bundleName {
		NSString *key = [NSString stringWithFormat:@"%@-debug", bundleName];
		
		// 检查 key 是否存在
		if (![[NSUserDefaults standardUserDefaults] objectForKey:key]) {
				return @{};
		}
		
		// 获取字符串值
		NSString *debugInfoStr = [[NSUserDefaults standardUserDefaults] stringForKey:key];
		if (!debugInfoStr) {
				return @{};
		}
		
		// 转换为 Data
		NSData *data = [debugInfoStr dataUsingEncoding:NSUTF8StringEncoding];
		if (!data) {
				return @{};
		}
		
		// 解析 JSON
		NSError *error;
		id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
		
		if (error || ![jsonObject isKindOfClass:[NSDictionary class]]) {
				return @{};
		}
		
		return (NSDictionary<NSString *, id> *)jsonObject;
}

- (void)systemMemoryWarning {
	XTNavigationViewController *nav = [XTNativeRouterManager shared].nav;
	NSArray *viewControllers = nav.viewControllers;
	
	NSArray *allContexts = [[XTJSBridgePool shared] fetchAllRuntimeContext];
	NSArray *newAllContexts = [allContexts copy];
	
	NSMutableArray *usefulContexts = [NSMutableArray array];
	
	for (XTJSRuntimeContext *context in newAllContexts) {
		for (UIViewController *vc in viewControllers) {
			if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
				XTBaseBundleViewController *baseVC = (XTBaseBundleViewController *)vc;
				if (context.host && baseVC.runtimeContext.host == context.host) {
					[usefulContexts addObject:context];
					break;
				}
			}
		}
	}
	
	NSMutableArray *uselessContexts = [NSMutableArray array];

	for (XTJSRuntimeContext *context in newAllContexts) {
		if (![usefulContexts containsObject:context]) {
			[uselessContexts addObject:context];
		}
	}
	
	NSMutableArray *canReleaseContexts = [NSMutableArray array];
	
	for (XTJSRuntimeContext *context in uselessContexts) {
		
		if ([context.jsBundleName isEqualToString:[XTJSBundleTool.shared getMainBundleName]]) {
			continue;
		}
		
		if ([context isPreloadCommonMode] && ![context isPreloadCommonCompleted]) {
			continue;
		}
		
		if ([context isPreloadCommonMode] && [context isPreloadCommonCompleted] && ![context isBizLoadCompleted]) {
			continue;
		}
		
		[canReleaseContexts addObject:context];
	}
		
	if (canReleaseContexts.count == 0) {
		return;
	}
	
	// lru 排序，按最后访问时间升序排序（最久未使用的在前面）
	NSArray *lruContexts = [canReleaseContexts sortedArrayUsingComparator:^NSComparisonResult(XTJSRuntimeContext *obj1, XTJSRuntimeContext *obj2) {
		if (obj1.lastAccessTimestampMs < obj2.lastAccessTimestampMs) {
			return NSOrderedAscending;
		} else if (obj1.lastAccessTimestampMs > obj2.lastAccessTimestampMs) {
			return NSOrderedDescending;
		}
		return NSOrderedSame;
	}];
	
	CPLog(@"lruContexts：%@", lruContexts);
	
	XTJSRuntimeContext *lruContext = lruContexts.firstObject;
	
	CPLog(@"lruContext：%@", lruContext);
	
	if (!lruContext) {
		CPLog(@"未找到可释放的 bridge");
		return;
	}
		
	[[XTJSBridgePool shared] releaseBundle:lruContext.jsBundleName autoRelease:YES];
	
}

- (void)memoryAdd {
	// do nothing
	NSMutableData *data = [NSMutableData dataWithLength:1024 * 1024 * 500];
	memset(data.mutableBytes, 0xFF, data.length);
	[self.testDataArray addObject:data];
}

@end
