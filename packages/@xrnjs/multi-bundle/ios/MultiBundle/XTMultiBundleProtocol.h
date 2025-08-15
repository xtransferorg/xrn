//
//  XTMultiBundleProtocol.h
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/28.
//

#ifndef XTMultiBundleProtocol_h
#define XTMultiBundleProtocol_h
#import <React/RCTBridge.h>

@class XTBundleData;
@protocol XTMultiBundleDataSource<NSObject>

@required
- (NSArray <XTBundleData *>*_Nonnull)multiBundleForBundleModelArray;

@optional
- (NSDictionary *_Nullable)multiBundleForLaunchOptions;

@end

@protocol XTBundleProvider<NSObject>

@required
- (NSURL *_Nonnull)sourceURLForBridge:(RCTBridge *_Nonnull)bridge bundleData:(XTBundleData *_Nonnull)bundleData;

@optional
- (NSArray<id<RCTBridgeModule>> *_Nonnull)extraModulesForBridge:(RCTBridge *_Nonnull)bridge bundleData:(XTBundleData *_Nonnull)bundleData;

- (BOOL)supportCommonBundleForBundleData:(XTBundleData *_Nonnull)bundleModel;


@end


#endif /* XTMultiBundleProtocol_h */
