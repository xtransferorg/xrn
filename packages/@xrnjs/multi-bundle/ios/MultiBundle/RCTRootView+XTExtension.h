//
//  RCTRootView+XTExtension.h
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRootView (XTExtension)

@property (nonatomic, copy) NSString *xt_jsBundleName;
@property (nonatomic, copy) NSString *xt_moduleName;
@property (nonatomic, copy) NSString *xt_codePushKey;

@end

NS_ASSUME_NONNULL_END
