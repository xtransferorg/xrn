//
//  XTPopViewManager.m
//  xtapp
//
//  Created by liwenjin on 2022/8/30.
//  Copyright © 2022 Facebook. All rights reserved.
//

#import "XTPopViewManager.h"
#import "XTToastView.h"

@interface XTPopViewManager()

@end

@implementation XTPopViewManager

RCT_EXPORT_MODULE(XRNLoadingModule)

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(hide) {

}

RCT_EXPORT_METHOD(show) {

}
RCT_EXPORT_METHOD(changeProgress:(CGFloat)progress version:(NSString*)version){

}

RCT_EXPORT_METHOD(showLoading) {
  [[XTToastView shared] showLottieLoadingInteroperable:YES];
}

RCT_EXPORT_METHOD(updateProgress:(CGFloat)progress) {
  [[XTToastView shared] updateProgress:progress];
}

RCT_EXPORT_METHOD(hideLoading) {
  [[XTToastView shared] hideLottieLoading];
}

RCT_EXPORT_METHOD(lazyLoadBundle) {
  NSLog(@"lazyLoadBundle 目前暂时空实现，和Android有区别");
}

@end
