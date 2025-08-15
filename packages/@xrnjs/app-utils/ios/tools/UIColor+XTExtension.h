//
//  UIColor+XTExtension.h
//  xtapp
//
//  Created by  xtgq on 2024/2/20.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIColor (XTExtension)

/**
 *  16进制转换成UIColor
 *
 *  @param hex
 *
 *  @return UIColor
 */
+ (UIColor *)colorWithRGBHex:(UInt32)hex;

/**
 *  16进制转换成UIColor，带透明度
 *
 *  @param hex   十六进制颜色   eg. 0x8b8b8e
 *  @param alpha 透明度        取值 0-1.0
 *
 *  @return UIColor
 */
+ (UIColor *)colorWithRGBHex:(UInt32)hex alpha:(CGFloat)alpha;

@end

NS_ASSUME_NONNULL_END
