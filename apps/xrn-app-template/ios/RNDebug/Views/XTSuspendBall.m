//
//  XTSuspendBall.m
//  XRNTemplate
//
//  Created by  xtgq on 2024/4/23.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTSuspendBall.h"

#define SCREEN_WIDTH    [UIScreen mainScreen].bounds.size.width
#define SCREEN_HEIGHT   [UIScreen mainScreen].bounds.size.height
#define ViewSize 50
#define KHeightFit(w)           (((w) / 667.0) * SCREEN_HEIGHT)

#define LRString [NSString stringWithFormat:@"%s", __FILE__].lastPathComponent
#define DLog(...) {\
NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];\
[dateFormatter setDateFormat:@"YYYY-MM-dd hh:mm:ss"];\
NSString *dateString = [dateFormatter stringFromDate:[NSDate date]];\
printf("%s %s 第%d行:%s\n\n",[dateString UTF8String],[LRString UTF8String] ,__LINE__, [[NSString stringWithFormat:__VA_ARGS__] UTF8String]);}

@implementation XTSuspendBall

- (instancetype)init{
    self = [super init];
    if (self) {
        self.backgroundColor = UIColor.greenColor;
        self.layer.masksToBounds = YES;
        self.layer.cornerRadius = ViewSize/2;
        self.alpha = 0.5;
        
        self.orientation = [[UIApplication sharedApplication] statusBarOrientation];
        if (self.orientation == UIInterfaceOrientationLandscapeRight){
            self.frame = CGRectMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20, KHeightFit(80) + ViewSize/2, ViewSize, ViewSize);
        }else{
            self.frame = CGRectMake(SCREEN_WIDTH - ViewSize/2, KHeightFit(80) + ViewSize/2, ViewSize, ViewSize);
        }
        
        self.btn = [UIButton buttonWithType:UIButtonTypeCustom];
        [self.btn setTitle:@"" forState:UIControlStateNormal];
        self.btn.titleLabel.font = [UIFont boldSystemFontOfSize:12];
        [self.btn setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
        self.btn.frame = CGRectMake(5, 5, 40, 40);
        self.btn.backgroundColor = UIColor.greenColor;
        self.btn.layer.cornerRadius = 20;
        [self.btn addTarget:self action:@selector(btnClick:) forControlEvents:UIControlEventTouchUpInside];
        [self addSubview:self.btn];
        [self changeCoordinateScale];
        isChangePosition = NO;
        
        UIPanGestureRecognizer *panRcognize=[[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePanGesture:)];
        [panRcognize setMinimumNumberOfTouches:1];
        [panRcognize setEnabled:YES];
        [panRcognize delaysTouchesEnded];
        [panRcognize cancelsTouchesInView];
        [self addGestureRecognizer:panRcognize];
        
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(didChangeStatusBarOrientation)
                                                     name:UIApplicationDidChangeStatusBarOrientationNotification
                                                   object:nil];
    }
    return self;
}

- (void)didChangeStatusBarOrientation {
    self.orientation = [UIApplication sharedApplication].statusBarOrientation;
    switch ([UIDevice currentDevice].orientation) {
        case UIDeviceOrientationPortraitUpsideDown:
            [self locationChange:@"Down"];
            break;
        case UIDeviceOrientationLandscapeLeft:{
            [self locationChange:@"left"];
        }
            break;
        case UIDeviceOrientationLandscapeRight:{
            [self locationChange:@"right"];
        }
            break;
        case UIDeviceOrientationPortrait:{
            [self locationChange:@"Portrait"];
        }
            break;
        default:
            break;
    }
}

- (void)locationChange:(NSString *)message{
    if (SCREEN_HEIGHT > SCREEN_WIDTH) {
        if ([message isEqualToString:@"Portrait"]) {
            self.center = CGPointMake(changeWid * SCREEN_WIDTH, changeHig * SCREEN_HEIGHT);
        }else{
            self.center = CGPointMake(changeWid * SCREEN_WIDTH, changeHig * SCREEN_HEIGHT - [self vg_safeDistanceTop]);
        }
    }else{
        if ([message isEqualToString:@"left"]) {
            self.center = CGPointMake(changeWid * SCREEN_WIDTH + [self vg_safeDistanceTop] + ViewSize, changeHig * SCREEN_HEIGHT);
        }else{
            self.center = CGPointMake(changeWid * SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize, changeHig * SCREEN_HEIGHT);
        }
    }
    [self changeCoordinateScale];
    
}

- (void)changeCoordinateScale{
    changeHig = self.center.y/SCREEN_HEIGHT;
    changeWid = self.center.x/SCREEN_WIDTH;
    if (self.orientation == UIInterfaceOrientationLandscapeRight) {
        if (self.center.x > SCREEN_WIDTH/2) {
            self.center = CGPointMake(SCREEN_WIDTH, self.center.y);
        }else{
            self.center = CGPointMake([self vg_safeDistanceTop] + ViewSize + 20, self.center.y);
        }
    }else if(self.orientation == UIInterfaceOrientationLandscapeLeft){
        if (self.center.x > SCREEN_WIDTH/2) {
            self.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20, self.center.y);
        }else{
            self.center = CGPointMake(0, self.center.y);
        }
    }else{
        if (self.center.x > SCREEN_WIDTH/2) {
            self.center = CGPointMake(SCREEN_WIDTH, self.center.y);
        }else{
            self.center = CGPointMake(0, self.center.y);
        }
    }
}

- (void)showSuspendView{
    self.hidden = NO;
}

- (void)dismissSuspendView{
    self.hidden = YES;
}

- (void)btnClick:(UIButton *)button{
    if (self.delegate && [self.delegate respondsToSelector:@selector(suspendViewButtonClick:)]) {
        [self.delegate suspendViewButtonClick:button];
    }
    if (!isChangePosition) {
        if (self.orientation == UIInterfaceOrientationLandscapeLeft) {
            [UIView animateWithDuration:0.5 animations:^{
                self.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20 - 20, self.center.y);
            }];
        }else{
            [UIView animateWithDuration:0.5 animations:^{
                self.center = CGPointMake(SCREEN_WIDTH - ViewSize, self.center.y);
            }];
        }
    }else{
        if (self.orientation == UIInterfaceOrientationLandscapeRight) {
            if (self.center.x > SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH - ViewSize, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake([self vg_safeDistanceTop] + ViewSize + 20 + 20, self.center.y);
                }];
            }
        }else if(self.orientation == UIInterfaceOrientationLandscapeLeft){
            if (self.center.x > SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20 - 20, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(ViewSize, self.center.y);
                }];
            }
        }else{
            if (self.center.x < SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(ViewSize, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH - ViewSize, self.center.y);
                }];
            }
        }
        
    }
    
    self.alpha = 1;
    self.timer = [NSTimer scheduledTimerWithTimeInterval:3 target:self selector:@selector(timerAction) userInfo:nil repeats:NO];
}


- (void)timerAction{
    self.alpha = 0.5;
    if (!isChangePosition) {
        if (self.orientation == UIInterfaceOrientationLandscapeLeft) {
            [UIView animateWithDuration:0.5 animations:^{
                self.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20, self.center.y);
            }];
        }else{
            [UIView animateWithDuration:0.5 animations:^{
                self.center = CGPointMake(SCREEN_WIDTH, self.center.y);
            }];
        }
    }else{
        if (self.orientation == UIInterfaceOrientationLandscapeRight) {
            if (self.center.x > SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake([self vg_safeDistanceTop] + ViewSize + 20, self.center.y);
                }];
            }
        }else if(self.orientation == UIInterfaceOrientationLandscapeLeft){
            if (self.center.x > SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(0, self.center.y);
                }];
            }
            
        }else{
            if (self.center.x > SCREEN_WIDTH/2) {
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(SCREEN_WIDTH, self.center.y);
                }];
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    self.center = CGPointMake(0, self.center.y);
                }];
            }
            
        }
    }
    [self.timer invalidate];
    self.timer = nil;
}

- (void)handlePanGesture:(UIPanGestureRecognizer *)recognizer
{
    UIGestureRecognizerState recState =  recognizer.state;
    isChangePosition = YES;
    
    switch (recState) {
        case UIGestureRecognizerStateBegan:
            self.alpha = 1;
            break;
        case UIGestureRecognizerStateChanged:
        {
            self.alpha = 1;
            CGPoint translation = [recognizer translationInView:self];
            recognizer.view.center = CGPointMake(recognizer.view.center.x + translation.x, recognizer.view.center.y + translation.y);
        }
            break;
        case UIGestureRecognizerStateEnded:
        {
            self.alpha = 0.5;
            CGPoint stopPoint = CGPointMake(0, SCREEN_HEIGHT / 2);
            if (recognizer.view.center.x < SCREEN_WIDTH / 2) {
                stopPoint = CGPointMake(ViewSize/2, recognizer.view.center.y);
            }else{
                stopPoint = CGPointMake(SCREEN_WIDTH - ViewSize/2,recognizer.view.center.y);
            }
            if (stopPoint.y - ViewSize/2 <= 0) {
                if (stopPoint.x - ViewSize/2 <= SCREEN_WIDTH/2) {
                    stopPoint = CGPointMake(0, stopPoint.y + [self vg_safeDistanceTop] + ViewSize);
                }else{
                    stopPoint = CGPointMake(SCREEN_WIDTH, stopPoint.y + [self vg_safeDistanceTop] + ViewSize);
                }
            }
            if (stopPoint.y + ViewSize + 20 >= SCREEN_HEIGHT) {
                if (stopPoint.x - ViewSize/2 <= SCREEN_WIDTH/2) {
                    stopPoint = CGPointMake(0, stopPoint.y - [self vg_safeDistanceBottom] - ViewSize/2);
                }else{
                    stopPoint = CGPointMake(SCREEN_WIDTH, stopPoint.y - [self vg_safeDistanceBottom] - ViewSize/2);
                }
            }
            
            if (stopPoint.x - ViewSize/2 <= 0) {
                stopPoint = CGPointMake(0, stopPoint.y);
            }
            if (stopPoint.x + ViewSize/2 >= SCREEN_WIDTH) {
                stopPoint = CGPointMake(SCREEN_WIDTH, stopPoint.y);
            }
            
            lastPoint = stopPoint;
            
            CGRect rect = [self convertRect:self.frame toView:self];
            
            if (self.orientation == UIInterfaceOrientationLandscapeRight) {
                if (stopPoint.x > SCREEN_WIDTH/2) {
                    [UIView animateWithDuration:0.5 animations:^{
                        recognizer.view.center = CGPointMake(SCREEN_WIDTH, stopPoint.y);
                    }];
                }else{
                    [UIView animateWithDuration:0.5 animations:^{
                        recognizer.view.center = CGPointMake([self vg_safeDistanceTop] + ViewSize + 20, stopPoint.y);
                    }];
                }
            }else if(self.orientation == UIInterfaceOrientationLandscapeLeft){
                if (stopPoint.x > SCREEN_WIDTH/2) {
                    [UIView animateWithDuration:0.5 animations:^{
                        recognizer.view.center = CGPointMake(SCREEN_WIDTH - [self vg_safeDistanceTop] - ViewSize - 20, stopPoint.y);
                    }];
                }else{
                    [UIView animateWithDuration:0.5 animations:^{
                        recognizer.view.center = CGPointMake(0, stopPoint.y);
                    }];
                }
                
            }else{
                [UIView animateWithDuration:0.5 animations:^{
                    recognizer.view.center = stopPoint;
                }];
            }
            [self changeCoordinateScale];
        }
            break;
        default:
            break;
    }
    [recognizer setTranslation:CGPointMake(0, 0) inView:self];
}

- (CGFloat)vg_safeDistanceTop {
    if (@available(iOS 13.0, *)) {
        NSSet *set = [UIApplication sharedApplication].connectedScenes;
        UIWindowScene *windowScene = [set anyObject];
        UIWindow *window = windowScene.windows.firstObject;
        return window.safeAreaInsets.top;
    } else if (@available(iOS 11.0, *)) {
        UIWindow *window = [UIApplication sharedApplication].windows.firstObject;
        return window.safeAreaInsets.top;
    }
    return 0;
}

- (CGFloat)vg_safeDistanceBottom {
    if (@available(iOS 13.0, *)) {
        NSSet *set = [UIApplication sharedApplication].connectedScenes;
        UIWindowScene *windowScene = [set anyObject];
        UIWindow *window = windowScene.windows.firstObject;
        return window.safeAreaInsets.bottom;
    } else if (@available(iOS 11.0, *)) {
        UIWindow *window = [UIApplication sharedApplication].windows.firstObject;
        return window.safeAreaInsets.bottom;
    }
    return 0;
}

@end
