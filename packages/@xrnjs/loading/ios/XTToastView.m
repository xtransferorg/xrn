//
//  XTToastView.m
//  xtapp
//
//  Created by  xtgq on 2024/2/20.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTToastView.h"
#import "RCTAppDelegate.h"
#import <MBProgressHUD/MBProgressHUD.h>
#import <React/RCTUtils.h>
#import "react_native_xrn_loading-Swift.h"


#define SCREEN_WIDTH UIScreen.mainScreen.bounds.size.width
#define SCREEN_HEIGHT UIScreen.mainScreen.bounds.size.height

@interface XTToastView ()

@property (nonatomic, strong) UIProgressView *progressView;
@property (nonatomic, strong) UILabel *tipLabel;
@property (nonatomic, strong) UIView *customHud;
@property (nonatomic, strong) XTLoadingLottie *lottie;
@property (nonatomic, assign) CGFloat progress;
@end

static MBProgressHUD *_hud = nil;
static MBProgressHUD *_lottieHud = nil;


@implementation XTToastView

+ (instancetype)shared {
    static XTToastView *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XTToastView alloc] init];
    });
    return shareInstance;
}

- (void)showLoadingInteroperable:(BOOL)interactionEnabled {
  [_hud hideAnimated:NO];
  _hud = nil;
  RCTAppDelegate *appDelegate = (RCTAppDelegate *) [[UIApplication sharedApplication] delegate];
  UIWindow *window = appDelegate.window;
  UIWindow *keyWindow = RCTKeyWindow();
  if (keyWindow == nil) {
    keyWindow = window;
  }
  MBProgressHUD *hud = [MBProgressHUD showHUDAddedTo:keyWindow animated:YES];
  _hud = hud;
  hud.mode = MBProgressHUDModeIndeterminate;
  hud.bezelView.style = MBProgressHUDBackgroundStyleSolidColor;
  hud.bezelView.color = [[UIColor alloc] initWithRed:0 green:0 blue:0 alpha:0.8];
  hud.bezelView.layer.cornerRadius = 8;
  hud.contentColor = [UIColor whiteColor];
  hud.minSize = CGSizeMake(100, 100);
  hud.userInteractionEnabled = interactionEnabled;
}

- (void)showLottieLoadingInteroperable:(BOOL)interactionEnabled {
  // 防止重复多次调用show，出现闪烁
  if (_lottieHud) {
    return;
  }
  
  [_lottieHud hideAnimated:NO];
  _lottieHud = nil;
  RCTAppDelegate *appDelegate = (RCTAppDelegate *)[[UIApplication sharedApplication] delegate];
  UIWindow *window = appDelegate.window;
  UIWindow *keyWindow = RCTKeyWindow();
  if (keyWindow == nil) {
    keyWindow = window;
  }
  
  MBProgressHUD *hud = [MBProgressHUD showHUDAddedTo:keyWindow animated:YES];
  _lottieHud = hud;
  
  UIView *customView = [self customLoadingView];
  hud.mode = MBProgressHUDModeCustomView;
  hud.customView = customView;
  
  hud.bezelView.backgroundColor = [UIColor whiteColor];
  hud.bezelView.style = MBProgressHUDBackgroundStyleSolidColor;
  hud.bezelView.color = [UIColor whiteColor];
  hud.contentColor = [UIColor whiteColor];
  hud.minSize = CGSizeMake(SCREEN_WIDTH, SCREEN_HEIGHT);
  hud.square = false;
  hud.margin = 0;
  hud.offset = CGPointMake(0, 0);
  hud.userInteractionEnabled = interactionEnabled;
}

- (void)hideLoading {
  if (_hud) {
    [_hud hideAnimated:YES];
    _hud = nil;
  }
}

- (void)hideLottieLoading {
  if (_lottieHud) {
    [self.lottie removeAnimation];
    [_lottieHud hideAnimated:NO];
    _lottieHud = nil;
  }
}

- (void)updateProgress:(CGFloat)progress {
  if (_lottieHud) {
    self.progressView.hidden = NO;
    self.tipLabel.frame = CGRectMake(-100, 25, 200, 20);
    // js传的值是0-100
    self.progress = progress / 100;
    if (self.progress >= 1.0) {
      self.progress = 1.0;
    }
    [self.progressView setProgress:self.progress animated:YES];
  }
}

- (UIView *)customLoadingView {
  self.progress = 0.0;
  [self.progressView setProgress:0.0 animated:NO];
  self.progressView.hidden = YES;
  self.tipLabel.frame = CGRectMake(-100, 0, 200, 20);
  
  [self.lottie addLottieAnimationTo:self.customHud withAnimationName:@"loadingLottie"];
  [self.customHud addSubview:self.progressView];
  [self.customHud addSubview:self.tipLabel];
  return self.customHud;
}

- (UIView *)customHud {
  if (!_customHud) {
    _customHud = [[UIView alloc] initWithFrame:CGRectMake(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)];
    _customHud.backgroundColor = [UIColor whiteColor];
  }
  return _customHud;
}

- (XTLoadingLottie *)lottie {
  if (!_lottie) {
    _lottie = [[XTLoadingLottie alloc] init];
  }
  return _lottie;
}

- (UIProgressView *)progressView {
  if (!_progressView) {
    _progressView = [[UIProgressView alloc] initWithProgressViewStyle:UIProgressViewStyleDefault];
    _progressView.hidden = YES;
    _progressView.frame = CGRectMake(-90, 0, 180, 6);
    _progressView.progress = 0;
    _progressView.progressTintColor = [UIColor colorWithRed:255/255.0 green:123/255.0 blue:0 alpha:1];
    _progressView.trackTintColor = [UIColor colorWithRed:210/255.0 green:210/255.0 blue:210/255.0 alpha:1];
    _progressView.layer.cornerRadius = 3;
  }
  return _progressView;
}

- (UILabel *)tipLabel {
  if (!_tipLabel) {
    _tipLabel = [[UILabel alloc] init];
    _tipLabel.frame = CGRectMake(-100, 0, 200, 20);
    _tipLabel.text = @"loading...";
    _tipLabel.font = [UIFont systemFontOfSize:16];
    _tipLabel.textAlignment = NSTextAlignmentCenter;
    _tipLabel.textColor = [UIColor blackColor];
  }
  return _tipLabel;
}

@end
