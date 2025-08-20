//
//  RCTBridge+XTExtension.h
//  xtapp
//
//  Created by  xtgq on 2024/1/26.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTBridge (XTExtension)

@property (nonatomic, copy, nullable) NSString *xt_jsBundleName;
@end

NS_ASSUME_NONNULL_END
