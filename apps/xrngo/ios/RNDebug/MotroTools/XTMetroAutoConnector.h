//
//  XTMetroAutoConnector.h
//  xrngo
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// 自动探测 / 连接 Metro 服务
@interface XTMetroAutoConnector : NSObject

/// 检查当前 bundle 是否可连接 Metro
+ (BOOL)checkMetroConnection:(NSString *)bundleName;

/// 切 bundle 时若 Metro 可达，更新 RCTBundleURLProvider.jsLocation
+ (void)updateJsLocationForBundleName:(NSString *)bundleName;

@end

NS_ASSUME_NONNULL_END
