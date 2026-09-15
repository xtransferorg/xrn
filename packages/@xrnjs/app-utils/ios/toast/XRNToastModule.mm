//
//  XRNToastModule.m
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XRNToastModule.h"
#import "XRNToastView.h"
#import <XRNAppUtilsModuleSpec/XRNAppUtilsModuleSpec.h>

@interface XRNToastModule()<NativeXRNToastModuleSpec>

@end

@implementation XRNToastModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNToastModuleSpecJSI>(params);
}


RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(showToast:(NSString *)message
                  duration:(NSString *)duration
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSInteger time = [duration isEqualToString:@"LONG"] ? 5 : 3;
        [[XRNToastView shared] showToast:message duration:time];
    });
}

RCT_EXPORT_METHOD(hideToast:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [[XRNToastView shared] hideToast];
    });
}


@end
