//
//  XRNToastView.m
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XRNToastView.h"
#import "MBProgressHUD.h"
#import "UIColor+XTExtension.h"
#import "RCTAppDelegate.h"

@interface XRNToastView ()

@end

@implementation XRNToastView

+ (instancetype)shared {
    static XRNToastView *shareInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[XRNToastView alloc] init];
    });
    return shareInstance;
}

- (void)showToast:(NSString *)message duration:(NSInteger)duration {
    
    RCTAppDelegate *appDelegate = (RCTAppDelegate *) [[UIApplication sharedApplication] delegate];
    UIWindow *window = appDelegate.window;
    
    MBProgressHUD *hud = [MBProgressHUD showHUDAddedTo:window animated:YES];
    hud.mode = MBProgressHUDModeText;
    hud.contentColor = [UIColor whiteColor];
    hud.bezelView.style = MBProgressHUDBackgroundStyleSolidColor;
    hud.bezelView.backgroundColor = [UIColor colorWithRGBHex:0x222222 alpha:0.8f];
    hud.bezelView.layer.cornerRadius = 8;
    
    NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc] initWithString:message];
    NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
    paragraphStyle.lineSpacing = 4;
    [attributedString addAttribute:NSParagraphStyleAttributeName value:paragraphStyle range:NSMakeRange(0, attributedString.length)];
    hud.detailsLabel.attributedText = attributedString;
    hud.detailsLabel.font = [UIFont boldSystemFontOfSize:14];
    hud.detailsLabel.textColor = [UIColor whiteColor];
    hud.userInteractionEnabled = NO;
    hud.margin = 12;
    hud.minShowTime = 3;
    hud.minSize = CGSizeMake(120, 40);
    
    [hud hideAnimated:YES afterDelay:duration];
}

- (void)hideToast {
    
}

@end
