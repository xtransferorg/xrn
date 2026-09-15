//
//  XTNavigationViewController.h
//  xtapp
//
//  Created by liyuan on 2024/1/15.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "XTNavigationLifecycleProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@interface XTNavigationViewController : UINavigationController

@property (nonatomic, strong) id<XTNavigationLifecycleProtocol> lifecycleObserver;

@end

NS_ASSUME_NONNULL_END
