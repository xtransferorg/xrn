//
//  ExpoImageContentPosition.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ContentPositionValue)
@interface ExpoImageContentPositionValue : NSObject

@property (nonatomic, strong, readonly, nullable) id value;

// 初始化方法
- (instancetype)initWithValue:(nullable id)value;

// 类型检查方法
- (BOOL)isDouble;
- (BOOL)isString;

// 获取值的方法
- (nullable NSNumber *)getDoubleValue;
- (nullable NSString *)getStringValue;

@end

NS_SWIFT_NAME(ContentPosition)
@interface ExpoImageContentPosition : NSObject

@property (nonatomic, strong, nullable) ExpoImageContentPositionValue *top;
@property (nonatomic, strong, nullable) ExpoImageContentPositionValue *bottom;
@property (nonatomic, strong, nullable) ExpoImageContentPositionValue *left;
@property (nonatomic, strong, nullable) ExpoImageContentPositionValue *right;

+ (instancetype)center;
- (CGPoint)offsetWithContentSize:(CGSize)contentSize containerSize:(CGSize)containerSize;

@end

NS_ASSUME_NONNULL_END
