//
//  XRNToastModule.m
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XRNToastModule.h"
#import "XRNToastView.h"

@implementation XRNToastModule

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(showToast:(NSString *)message
                  duration:(NSInteger)duration
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSInteger time = (duration < 3) ? 3 : duration;
        [[XRNToastView shared] showToast:message duration:time];
    });
}

RCT_EXPORT_METHOD(hideToast:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [[XRNToastView shared] hideToast];
    });
}

@end
