//
//  XTJSBridgePool.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBridgePool.h"
#import "XTJSBundleModel.h"
#import "XTBundleData.h"
#import "XTJSBridgeDelegation.h"
#import <YYCache/YYMemoryCache.h>
#import "RCTBridge+XTExtension.h"

@interface XTJSBridgePool ()

@property (nonatomic, strong) RCTBridge *mainJSBridge;
@property (nonatomic, strong) XTJSBundleModel *mainBundleModel;
@property (nonatomic, copy) NSArray <XTJSBundleModel *>*bundleModelArray;
@property (nonatomic, strong) NSHashTable <RCTBridge *>*weakHashTable;
@property (nonatomic, strong) YYMemoryCache *cache;
@property (nonatomic, strong) NSMutableArray <NSString *>*forceCacheBundleArray;

@end

@implementation XTJSBridgePool

+ (instancetype)shared {
    static XTJSBridgePool *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XTJSBridgePool alloc] init];
        YYMemoryCache *cache = [[YYMemoryCache alloc] init];
        cache.name = @"RCTBridge cache";
        cache.countLimit = 10;
        cache.shouldRemoveAllObjectsWhenEnteringBackground = NO;
        cache.didReceiveMemoryWarningBlock = ^(YYMemoryCache * _Nonnull cache) {
            NSLog(@"didReceiveMemoryWarningBlock：%@", cache);
        };
        cache.didEnterBackgroundBlock = ^(YYMemoryCache * _Nonnull cache) {
            NSLog(@"didEnterBackgroundBlock：%@", cache);
        };
        shareInstance.cache = cache;
#if DEBUG
        shareInstance.forceCacheBundleArray = @[].mutableCopy;
#else
        shareInstance.forceCacheBundleArray = @[].mutableCopy;
#endif
        shareInstance.weakHashTable = [NSHashTable weakObjectsHashTable];
    });
    return shareInstance;
}

- (void)preLoadBundle:(NSString *)bundleName {
    // do nothing
}

/**
 Configure bridge information for multiple JS bundles.

 - Parameters:
   - bundleArray: List of JS bundles to register (including bundle name, module name, CodePush key, port, and whether it is the main bundle).
   - launchOptions: App launch options used to initialize the main bridge.

 Process:
 1. Convert each `XTBundleData` to an internal `XTJSBundleModel` and create an `XTJSBridgeDelegation` for it.
 2. Validate and locate the unique main bundle and save it as `mainBundleModel`.
 3. Initialize the main `RCTBridge` with `launchOptions`.
 4. Remove the main bundle from the list and save the remaining bundles to `bundleModelArray`.
 5. For bundles listed in `forceCacheBundleArray`, pre-create and cache their corresponding `RCTBridge` instances.
 */
 - (void)setupAllJSBridgeInfo:(NSArray <XTBundleData *>*)bundleArray launchOptions:(NSDictionary *)launchOptions {
    
    NSMutableArray <XTJSBundleModel *>*bundleModelArray = [NSMutableArray arrayWithCapacity:10];
    for (NSInteger i = 0; i < bundleArray.count; i++) {
        XTBundleData *bundle = bundleArray[i];
        XTJSBridgeDelegation *delegation = [[XTJSBridgeDelegation alloc] initWithBundleData:bundle];
        XTJSBundleModel *model = [[XTJSBundleModel alloc] initWithJSBundleName:bundle.jsBundleName moduleName:bundle.moduleName codePushKey:bundle.codePushKey portNum:bundle.portNum isMain:bundle.isMain delegation:delegation];
        [bundleModelArray addObject:model];
    }
    
    NSMutableArray <XTJSBundleModel *>*modelArray = bundleModelArray;
    NSInteger NoExistIndex = -1;
    NSInteger mainBundleIndex = NoExistIndex;
    for (NSInteger i = 0; i < modelArray.count; i++) {
      XTJSBundleModel *bundleModel = modelArray[i];
      if (bundleModel.isMain) {
        if (mainBundleIndex == NoExistIndex) {
          mainBundleIndex = i;
        } else {
          NSAssert(NO, @"MultiBundle find main bundle more than one");
        }
      }
    }
    
    if (mainBundleIndex == NoExistIndex) {
      NSAssert(mainBundleIndex > NoExistIndex, @"MultiBundle can't find main bundle");
    }
    
    self.mainBundleModel = modelArray[mainBundleIndex];

    [self loadMainBridgeWithLaunchOptions:launchOptions];
    

    [modelArray removeObjectAtIndex:mainBundleIndex];
    
    self.bundleModelArray = modelArray;
    
    for (XTJSBundleModel *model in self.bundleModelArray) {
        if ([self.forceCacheBundleArray containsObject:model.jsBundleName]) {
            [self loadBridgeToCache:model];
        }
    }
}

/**
 Initialize and store the main RCTBridge.

 - Parameter launchOption: App launch options used when creating the main bridge.

 Behavior:
 1. Creates a new `RCTBridge` with the main bundle's delegation and provided launch options.
 2. Sets the bridge's `xt_jsBundleName` to the main bundle name.
 3. Stores the bridge as the shared `mainJSBridge` instance.
 */
- (void)loadMainBridgeWithLaunchOptions:(NSDictionary *)launchOption {
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self.mainBundleModel.delegation launchOptions:launchOption];
    bridge.xt_jsBundleName = self.mainBundleModel.jsBundleName;
    XTJSBridgePool.shared.mainJSBridge = bridge;
}

/**
 Create a new RCTBridge for the given bundle model and store it in the in-memory cache.

 - Parameter model: The bundle model describing the JS bundle to initialize.
 - Returns: The newly created `RCTBridge` instance.

 Behavior:
 1. Builds launch options using the bundle name.
 2. Initializes an `RCTBridge` with the model's delegation and the launch options.
 3. Sets the bridge's `xt_jsBundleName`.
 4. Caches the bridge and tracks it in the weak hash table for later retrieval.
 */
 - (RCTBridge *)loadBridgeToCache:(XTJSBundleModel *)model {
    NSDictionary *options = @{@"xtBundleName":model.jsBundleName};
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:model.delegation launchOptions:options];
    bridge.xt_jsBundleName = model.jsBundleName;
    [self.cache setObject:bridge forKey:model];
    [self.weakHashTable addObject:bridge];
    return bridge;
}

/**
 Retrieve an RCTBridge for the specified JS bundle name.

 - Parameter jsbundleName: The target JS bundle name.
 - Returns: The main bridge if the name matches the main bundle; otherwise a cached or newly created bridge for the bundle. Returns nil if the bundle is unknown.

 Behavior:
 1. If the requested name equals the main bundle name, return the main bridge.
 2. Otherwise, find the corresponding bundle model in `bundleModelArray`.
 3. If a cached bridge exists, return it; if not, create a new bridge via `loadBridgeToCache:` and return it.
 */
 - (RCTBridge *)fetchJSBridgeWithJSBundleName:(NSString *)jsbundleName {
    NSString *mainBundleName = self.mainBundleModel.jsBundleName;
    if ([jsbundleName isEqualToString:mainBundleName]) {
        return self.mainJSBridge;
    }
	
    XTJSBundleModel *currentModel;
    for (XTJSBundleModel *model in self.bundleModelArray) {
        if ([model.jsBundleName isEqualToString:jsbundleName]) {
            currentModel = model;
            break;
        }
    }
	
    if (currentModel == nil) {
        return nil;
    }
	
    RCTBridge *cacheBridge = [self.cache objectForKey:currentModel];
    if (!cacheBridge) {
        RCTBridge *newBridge = [self loadBridgeToCache:currentModel];
        return newBridge;
    } else {
        return cacheBridge;
    }
}

- (NSArray <RCTBridge *>*)fetchAllJSBridge {
    NSMutableArray <RCTBridge *>*allBridges = self.weakHashTable.allObjects.mutableCopy;
    [allBridges addObject:self.mainJSBridge];
    return allBridges.copy;
}

- (NSString *)fetchDefaultModuleNameWithJSBundleName:(NSString *)jsbundleName {
    NSString *mainModuleName = self.mainBundleModel.jsBundleName;
    if ([jsbundleName isEqualToString:mainModuleName]) {
        return mainModuleName;
    }
	
    XTJSBundleModel *currentModel;
    for (XTJSBundleModel *model in self.bundleModelArray) {
        if ([model.jsBundleName isEqualToString:jsbundleName]) {
            currentModel = model;
            break;
        }
    }
	
    NSString *moduleName = currentModel.moduleName;
    NSString *desc = [NSString stringWithFormat:@"Error: can't find default moduleName for %@", jsbundleName];
    NSAssert(moduleName, desc);
    return moduleName;
}

- (NSString *)queryCodePushDeploymentKeyWithExtensionName:(NSString *)extensionName {
    for (XTJSBundleModel *model in self.bundleModelArray) {
        NSString *bundleName = model.jsBundleName;
        if ([bundleName isEqualToString:extensionName]) return model.codePushKey;
    }
    return nil;
}

@end
