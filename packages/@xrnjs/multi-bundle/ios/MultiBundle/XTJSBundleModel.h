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

@property (nonatomic, copy, readonly) NSString *jsBundleName;
@property (nonatomic, copy, readonly) NSString *moduleName;
@property (nonatomic, copy, readonly) NSString *codePushKey;
@property (nonatomic, copy, readonly) NSString *portNum;
@property (nonatomic, assign, readonly) BOOL isMain;
@property (nonatomic, strong, readonly) XTJSBridgeDelegation *delegation;

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
                          moduleName:(NSString *)moduleName
                         codePushKey:(NSString *)codePushKey
                             portNum:(NSString *)portNum
                              isMain:(BOOL)isMain
                          delegation:(XTJSBridgeDelegation *)delegation;

@end

NS_ASSUME_NONNULL_END

