//
//  RCTRootView+XTExtension.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "RCTRootView+XTExtension.h"
#import <objc/runtime.h>

@implementation RCTRootView (XTExtension)

- (void)setXt_jsBundleName:(NSString *)xt_jsBundleName {
    objc_setAssociatedObject(self, @selector(xt_jsBundleName), xt_jsBundleName, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (NSString *)xt_jsBundleName {
    return objc_getAssociatedObject(self, _cmd);
}

- (void)setXt_moduleName:(NSString *)xt_moduleName {
    objc_setAssociatedObject(self, @selector(xt_moduleName), xt_moduleName, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (NSString *)xt_moduleName {
    return objc_getAssociatedObject(self, _cmd);
}

- (void)setXt_codePushKey:(NSString *)xt_codePushKey {
    objc_setAssociatedObject(self, @selector(xt_codePushKey), xt_codePushKey, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (NSString *)xt_codePushKey {
    return objc_getAssociatedObject(self, _cmd);
}

@end
