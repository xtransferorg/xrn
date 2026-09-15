//
//  XTJSBundleModel.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class XTJSBridgeDelegation;

@interface XTJSBundleModel : NSObject

@property (nonatomic, copy) NSString *jsBundleName;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSString *codePushKey;
@property (nonatomic, copy) NSString *portNum;
@property (nonatomic, assign) BOOL isMain;

@property (nonatomic, assign) BOOL isPreLoaded;
@property (nonatomic, copy) NSString *bindTargetBundleName;

@property (nonatomic, strong) XTJSBridgeDelegation *delegation;

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
                          moduleName:(NSString *)moduleName
                         codePushKey:(NSString *)codePushKey
                             portNum:(NSString *)portNum
                              isMain:(BOOL)isMain
												 isPreLoaded:(BOOL)isPreLoaded
								bindTargetBundleName:(NSString *)bindTargetBundleName
                          delegation:(XTJSBridgeDelegation *)delegation;

@end

NS_ASSUME_NONNULL_END

