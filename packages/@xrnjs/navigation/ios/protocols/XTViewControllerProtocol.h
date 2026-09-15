//
//  XTViewControllerProtocol.h
//  xtapp
//
//  Created by liyuan on 2024/1/15.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

#ifndef XTViewControllerProtocol_h
#define XTViewControllerProtocol_h

NS_ASSUME_NONNULL_BEGIN

@class XTJSRuntimeContext;

@protocol XTViewControllerProtocol <NSObject>

@property (nonatomic, readonly, strong) XTJSRuntimeContext *runtimeContext;
@property (nonatomic, readonly, copy) NSString *moduleName;
@property (nonatomic, readonly, copy) NSDictionary *initialProperties;

@required
- (instancetype)initWithRuntimeContext:(XTJSRuntimeContext *)runtimeContext
                            moduleName:(NSString *)moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties;
@end

NS_ASSUME_NONNULL_END

#endif /* XTViewControllerProtocol_h */
