//
//  XTMultiBundleManager.h
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/26.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeDelegate.h>
#import "XTMultiBundleProtocol.h"
#import "XTJSBridgePool.h"

NS_ASSUME_NONNULL_BEGIN
@interface XTMultiBundleManager : NSObject

@property (nonatomic, weak, readonly) XTJSBridgePool *pool;

+ (instancetype)shared;
- (void)startUp;

@property (nonatomic, weak, nullable) id <XTMultiBundleDataSource> dataSource;

@end
NS_ASSUME_NONNULL_END
