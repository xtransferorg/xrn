//
//  XTJSBridgePool.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@class XTJSBundleModel;
@class XTBundleData;
@interface XTJSBridgePool : NSObject

//@property (nonatomic, strong, readonly) RCTBridge *mainJSBridge;
//@property (nonatomic, strong, readonly) XTJSBundleModel *mainBundleModel;

+ (instancetype)shared;

- (void)setupAllJSBridgeInfo:(NSArray <XTBundleData *>*)bundleArray launchOptions:(NSDictionary *)launchOptions;
- (RCTBridge *)fetchJSBridgeWithJSBundleName:(NSString *)jsbundleName;
- (NSArray <RCTBridge *>*)fetchAllJSBridge;
- (NSString *)fetchDefaultModuleNameWithJSBundleName:(NSString *)jsbundleName;
- (NSString *)queryCodePushDeploymentKeyWithExtensionName:(NSString *)bundleName;

- (void)preLoadBundle:(NSString *)bundleName;

@end

NS_ASSUME_NONNULL_END
