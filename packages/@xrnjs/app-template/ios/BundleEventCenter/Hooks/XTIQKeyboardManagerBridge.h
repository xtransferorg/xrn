#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Pure ObjC shim so ObjC++ files (e.g. hooks pulling in ReactCodegen) do not need `@import IQKeyboardManagerSwift`,
/// which requires C++ modules in `.mm` translation units.
@interface XTIQKeyboardManagerBridge : NSObject

+ (void)xt_setViewSoftInputMode:(NSString *)mode;
+ (void)xt_setViewSoftInputSpace:(nullable id)space;
+ (void)xt_clearViewPositionInfo;

@end

NS_ASSUME_NONNULL_END
