//
//  UIColor+XTExtension.m
//  xtapp
//
//  Created by  xtgq on 2024/2/20.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "UIColor+XTExtension.h"

@implementation UIColor (XTExtension)

+ (UIColor *)colorWithRGBHex:(UInt32)hex {
    return [UIColor colorWithRGBHex:hex alpha:1.0f];
}

+ (UIColor *)colorWithRGBHex:(UInt32)hex alpha:(CGFloat)alpha {
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = (hex) & 0xFF;
    return [UIColor colorWithRed:r / 255.0f green:g / 255.0f blue:b / 255.0f alpha:alpha];
}
@end
