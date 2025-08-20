//
//  BundleNavigation.h
//  xtapp
//
//  Created by liyuan on 2023/10/16.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface BundleNavigation : RCTEventEmitter<RCTBridgeModule>


/// native向JS全局发送通知
/// - Parameters:
///   - eventName: 通知名称
///   - params: 通知携带的参数
- (void)publishAllBundleEvent:(NSString *)eventName params:(NSDictionary *)params;


/// native向指定bundle发送消息
/// - Parameters:
///   - eventName: eventName description
///   - params: params description
-(void)publishSingleBundleEvent:(NSString *)eventName params:(NSString *)params;


/// native跨bundle跳转
/// - Parameters:
///   - bundleName: bundleName description
///   - moduleName: moduleName description
///   - message: message description
///   - replace: replace description
- (void)native_navPushBundleProject:(NSString *)bundleName
                         moduleName:(NSString *)moduleName
                            message:(NSString *)message
                            replace:(BOOL)replace;
@end

NS_ASSUME_NONNULL_END
