//
//  XTJSBundleModel.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBundleModel.h"

@interface XTJSBundleModel ()

@property (nonatomic, copy) NSString *jsBundleName;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSString *codePushKey;
@property (nonatomic, copy) NSString *portNum;
@property (nonatomic, assign) BOOL isMain;
@property (nonatomic, strong) XTJSBridgeDelegation *delegation;

@end

@implementation XTJSBundleModel

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
                          moduleName:(NSString *)moduleName
                         codePushKey:(NSString *)codePushKey
                             portNum:(NSString *)portNum
                              isMain:(BOOL)isMain
                          delegation:(XTJSBridgeDelegation *)delegation {
    self = [super init];
    if (self) {
        self.jsBundleName = jsBundleName;
        self.moduleName = moduleName;
        self.codePushKey = codePushKey;
        self.portNum = portNum;
        self.isMain = isMain;
        self.delegation = delegation;
    }
    return self;
}

@end
