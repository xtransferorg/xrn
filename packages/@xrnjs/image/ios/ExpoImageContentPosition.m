//
//  ExpoImageContentPosition.m
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import "ExpoImageContentPosition.h"
#import <CoreGraphics/CoreGraphics.h>

@implementation ExpoImageContentPositionValue

// 初始化方法
- (instancetype)initWithValue:(nullable id)value {
    self = [super init];
    if (self) {
        _value = value;
    }
    return self;
}

// 类型检查：判断是否为 Double（NSNumber 类型）
- (BOOL)isDouble {
    return [self.value isKindOfClass:[NSNumber class]];
}

// 类型检查：判断是否为 NSString 类型
- (BOOL)isString {
    return [self.value isKindOfClass:[NSString class]];
}

// 获取 Double 值（如果是 NSNumber）
- (nullable NSNumber *)getDoubleValue {
    if ([self isDouble]) {
        return (NSNumber *)self.value;
    }
    return nil;
}

// 获取 NSString 值
- (nullable NSString *)getStringValue {
    if ([self isString]) {
        return (NSString *)self.value;
    }
    return nil;
}

@end

@implementation ExpoImageContentPosition

+ (instancetype)center {
  return [[ExpoImageContentPosition alloc] init];
}
// 计算水平偏移量
- (CGFloat)offsetXWithContentWidth:(CGFloat)contentWidth containerWidth:(CGFloat)containerWidth {
    CGFloat diff = containerWidth - contentWidth;
    
    if ([self.left isDouble]) {
        return -diff / 2 + [[self.left getDoubleValue] doubleValue];
    }
    if ([self.right isDouble]) {
        return diff / 2 - [[self.right getDoubleValue] doubleValue];
    }
    if ([self.left isString]) {
        CGFloat factor = [self factorFromPercentage:[self.left getStringValue]];
        return -diff / 2 + diff * factor;
    }
    if ([self.right isString]) {
        CGFloat factor = [self factorFromPercentage:[self.right getStringValue]];
        return diff / 2 - diff * factor;
    }
    return 0;
}

// 计算垂直偏移量
- (CGFloat)offsetYWithContentHeight:(CGFloat)contentHeight containerHeight:(CGFloat)containerHeight {
    CGFloat diff = containerHeight - contentHeight;
    
    if ([self.top isDouble]) {
        return -diff / 2 + [[self.top getDoubleValue] doubleValue];
    }
    if ([self.bottom isDouble]) {
        return diff / 2 - [[self.bottom getDoubleValue] doubleValue];
    }
    if ([self.top isString]) {
        CGFloat factor = [self factorFromPercentage:[self.top getStringValue]];
        return -diff / 2 + diff * factor;
    }
    if ([self.bottom isString]) {
        CGFloat factor = [self factorFromPercentage:[self.bottom getStringValue]];
        return diff / 2 - diff * factor;
    }
    return 0;
}

// 计算 CGPoint 偏移量
- (CGPoint)offsetWithContentSize:(CGSize)contentSize containerSize:(CGSize)containerSize {
    CGFloat x = [self offsetXWithContentWidth:contentSize.width containerWidth:containerSize.width];
    CGFloat y = [self offsetYWithContentHeight:contentSize.height containerHeight:containerSize.height];
    return CGPointMake(x, y);
}

// 私有方法：解析百分比字符串
- (CGFloat)factorFromPercentage:(NSString *)percentage {
    if ([percentage isEqualToString:@"center"]) {
        return 0.5;
    }
    if ([percentage containsString:@"%"]) {
        NSString *numberString = [percentage stringByReplacingOccurrencesOfString:@"%" withString:@""];
        return [numberString doubleValue] / 100.0;
    }
    return 0;
}

@end
