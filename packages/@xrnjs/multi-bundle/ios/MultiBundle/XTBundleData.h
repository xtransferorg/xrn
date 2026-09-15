//
//  XTBundleData.h
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/28.
//

#import <Foundation/Foundation.h>
#import "XTMultiBundleProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@interface XTBundleData : NSObject

@property (nonatomic, copy) NSString *jsBundleName;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSString *codePushKey;
@property (nonatomic, copy) NSString *portNum;
@property (nonatomic, assign) BOOL isMain;

@property (nonatomic, strong, nonnull) id<XTBundleProvider> provider;

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
                          moduleName:(NSString *)moduleName
                         codePushKey:(NSString *)codePushKey
                             portNum:(NSString *)portNum
                              isMain:(BOOL)isMain
                            provider:(id<XTBundleProvider> _Nonnull)provider;

@end

NS_ASSUME_NONNULL_END
