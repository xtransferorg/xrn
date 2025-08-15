//
//  XRNToastView.h
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface XRNToastView : UIView

+ (instancetype)shared;

- (void)showToast:(NSString *)message duration:(NSInteger)duration;
- (void)hideToast;
@end

NS_ASSUME_NONNULL_END
