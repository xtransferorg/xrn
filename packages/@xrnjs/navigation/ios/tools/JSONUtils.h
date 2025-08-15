//
//  JSONUtils.h
//  xtapp
//
//  Created by xtgq on 2024/9/3.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface JSONUtils : NSObject

/// 将 JSON 字符串转换为字典
/// @param jsonString JSON 格式的字符串
/// @return 转换后的字典，如果解析失败则返回空字典
+ (NSDictionary *)jsonStringToDictionary:(NSString *)jsonString;

/// 将字典转换为 JSON 字符串
/// @param dictionary 要转换的字典
/// @return 转换后的 JSON 字符串，如果转换失败则返回 nil
+ (nullable NSString *)dictionaryToJsonString:(nullable NSDictionary *)dictionary;


@end

NS_ASSUME_NONNULL_END
