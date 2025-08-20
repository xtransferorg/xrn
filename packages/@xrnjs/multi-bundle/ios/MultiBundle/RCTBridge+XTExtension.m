//
//  RCTBridge+XTExtension.m
//  xtapp
//
//  Created by  xtgq on 2024/1/26.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "RCTBridge+XTExtension.h"
#import <objc/runtime.h>

@implementation RCTBridge (XTExtension)

- (void)setXt_jsBundleName:(NSString *)xt_jsBundleName {
    objc_setAssociatedObject(self, @selector(xt_jsBundleName), xt_jsBundleName, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (NSString *)xt_jsBundleName {
    return objc_getAssociatedObject(self, _cmd);
}
@end
