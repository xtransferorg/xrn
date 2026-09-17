//
//  XTMultiBundleManager.h
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/26.
//

#import <Foundation/Foundation.h>
#import "XTMultiBundleProtocol.h"
#import "XTJSBridgePool.h"

NS_ASSUME_NONNULL_BEGIN
@interface XTMultiBundleManager : NSObject

+ (instancetype)shared;

@property (nonatomic, weak, readonly) XTJSBridgePool *pool;
@property (nonatomic, weak, nullable) id <XTMultiBundleDataSource> dataSource;

- (void)startUp;

@end
NS_ASSUME_NONNULL_END
