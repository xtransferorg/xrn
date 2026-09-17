//
//  XTNetworkWarmupUtil.h
//  xtapp
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// 冷启动网络预热。
@interface XTNetworkWarmupUtil : NSObject

+ (instancetype)shared;

/// 设置预热接口。数组内容会被复制并持有，调用预热方法时直接使用。
- (void)setNativeWarmupURLStrings:(NSArray<NSString *> *)nativeURLStrings;

/// 执行 Native 网络预热。
- (void)performNativeWarmupIfNeeded;

@end

NS_ASSUME_NONNULL_END
