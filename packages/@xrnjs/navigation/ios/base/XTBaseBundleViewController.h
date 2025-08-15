//
//  XTBaseBundleViewController.h
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import "XTViewControllerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@interface XTBaseBundleViewController : UIViewController<XTViewControllerProtocol>

@property (nonatomic, strong, readonly) RCTBridge *bridge;
@property (nonatomic, copy, readonly) NSString *moduleName;

// 控制器绑定一个导航容器key
@property (nonatomic, copy) NSString *rootStackKey;
// 控制器绑定一个navigation state
@property (nonatomic, copy) NSString *navigationState;

// 只有XTMainBundleViewController需要实现此方法，XTBundleViewController不需要实现
- (void)removeAniamtionVCAndPlaceHolderImage;

@end

NS_ASSUME_NONNULL_END
