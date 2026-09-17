#import "XTIQKeyboardManagerBridge.h"

@import IQKeyboardManagerSwift;

@implementation XTIQKeyboardManagerBridge

+ (void)xt_setViewSoftInputMode:(NSString *)mode
{
  [IQKeyboardManager shared].viewSoftInputMode.softInputMode = mode;
}

+ (void)xt_setViewSoftInputSpace:(id)space
{
  [IQKeyboardManager shared].viewSoftInputMode.space = space;
}

+ (void)xt_clearViewPositionInfo
{
  [[IQKeyboardManager shared] clearViewPositionInfo];
}

@end
