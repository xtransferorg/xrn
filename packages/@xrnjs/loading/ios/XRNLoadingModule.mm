//
//  XTPopViewManager.m
//  xtapp
//
//  Created by liwenjin on 2022/8/30.
//  Copyright © 2022 Facebook. All rights reserved.
//

#import "XRNLoadingModule.h"
#import "XTToastView.h"
#import <XRNLoadingModuleSpec/XRNLoadingModuleSpec.h>

@interface XRNLoadingModule() <NativeXRNLoadingModuleSpec>

@end

@implementation XRNLoadingModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNLoadingModuleSpecJSI>(params);
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(hide) {
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(show) {
  return @(YES);
}

RCT_EXPORT_METHOD(changeProgress:(CGFloat)progress version:(NSString*)version){

}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(showLoading) {
	if ([NSThread isMainThread]) {
		[[XTToastView shared] showLottieLoadingInteroperable:YES];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[[XTToastView shared] showLottieLoadingInteroperable:YES];
		});
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(updateProgress:(CGFloat)progress) {
	if ([NSThread isMainThread]) {
		[[XTToastView shared] updateProgress:progress];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[[XTToastView shared] updateProgress:progress];
		});
	}
	
  return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(hideLoading) {
	if ([NSThread isMainThread]) {
		[[XTToastView shared] hideLottieLoading];
	} else {
		dispatch_async(dispatch_get_main_queue(), ^{
			[[XTToastView shared] hideLottieLoading];
		});
	}
	
  return @(YES);
}

RCT_EXPORT_METHOD(lazyLoadBundle) {
  NSLog(@"lazyLoadBundle 目前暂时空实现，和Android有区别");
}

@end
