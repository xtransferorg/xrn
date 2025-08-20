//
//  XTToastView.h
//  xtapp
//
//  Created by  xtgq on 2024/2/20.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTToastView : UIView

+ (instancetype)shared;

- (void)showLoadingInteroperable:(BOOL)interactionEnabled;
- (void)showLottieLoadingInteroperable:(BOOL)interactionEnabled;
- (void)updateProgress:(CGFloat)progress;
- (void)hideLoading;
- (void)hideLottieLoading;
@end

NS_ASSUME_NONNULL_END
