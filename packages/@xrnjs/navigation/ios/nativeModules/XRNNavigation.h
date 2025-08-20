//
//  XRNNavigation.h
//  react-native-xrn-navigation
//
//  Created by  xtgq on 2025/5/14.
//

#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface XRNNavigation : RCTEventEmitter<RCTBridgeModule>

/**
 跨bundle跳转，回调传参, 这里参数js侧接受的是字符串
 */
- (void)sendCustomEvent:(NSString *)eventName data:(NSString *)dataStr;
@end

NS_ASSUME_NONNULL_END
