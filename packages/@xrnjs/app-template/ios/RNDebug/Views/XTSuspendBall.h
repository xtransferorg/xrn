//
//  XTSuspendBall.h
//  XRNTemplate
//
//  Created by  xtgq on 2024/4/23.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol SuspendViewDelegate <NSObject>

- (void)suspendViewButtonClick:(UIButton *)sender;
@end

@interface XTSuspendBall : UIView {
    CGPoint lastPoint;
    BOOL isChangePosition;
    CGFloat changeHig;
    CGFloat changeWid;
}

@property (nonatomic, retain) UIButton *btn;
@property (nonatomic, strong) NSTimer *_Nullable timer;
@property (nonatomic, assign) UIInterfaceOrientation orientation;
@property (nonatomic, weak) id<SuspendViewDelegate> delegate;

- (void)showSuspendView;
- (void)dismissSuspendView;
@end

NS_ASSUME_NONNULL_END
