//
//  XRNCustomKeyborad+XTHooks.mm
//  xrngo
//
//  Created by  xupeng on 2025/10/14.
//

#import "XRNCustomKeyborad+XTHooks.h"
#import "XTIQKeyboardManagerBridge.h"
#import <JRSwizzle/JRSwizzle.h>

@implementation XRNCustomKeyborad (XTHooks)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [XRNCustomKeyborad jr_swizzleMethod:@selector(setMode:) withMethod:@selector(xt_setMode:) error:nil];
    [XRNCustomKeyborad jr_swizzleMethod:@selector(setExtra:) withMethod:@selector(xt_setExtra:) error:nil];
//    [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(hiddenKeyboard) name:UIKeyboardWillHideNotification object:nil];
  });
}


- (void)xt_setMode:(NSString *)mode {
  [XTIQKeyboardManagerBridge xt_setViewSoftInputMode:mode];
  [self xt_setMode:mode];
}

- (void)xt_setExtra:(NSDictionary *)extra {
  if (extra[@"softInputSpace"]) {
    [XTIQKeyboardManagerBridge xt_setViewSoftInputSpace:extra[@"softInputSpace"]];
  }
  [self xt_setExtra:extra];
}

+ (void)hiddenKeyboard {
  [XTIQKeyboardManagerBridge xt_clearViewPositionInfo];
}

@end
