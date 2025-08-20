//
//  JSONUtils.m
//  xtapp
//
//  Created by xtgq on 2024/9/3.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "JSONUtils.h"

@implementation JSONUtils

+ (NSDictionary *)jsonStringToDictionary:(NSString *)jsonString {
    if (jsonString == nil || ![jsonString isKindOfClass:[NSString class]] || jsonString.length == 0) {
        NSLog(@"[JSONUtils] 输入的 JSON 字符串为空或不是字符串类型");
        return @{};
    }
    
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!jsonData) {
        NSLog(@"[JSONUtils] 无法将字符串转换为数据");
        return @{};
    }
    
    NSError *error = nil;
    id jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error];
    
    if (error) {
        NSLog(@"[JSONUtils] JSON 解析失败: %@", error.localizedDescription);
        return @{};
    }
    
    if ([jsonObject isKindOfClass:[NSDictionary class]]) {
        return jsonObject;
    } else {
        NSLog(@"[JSONUtils] 解析结果不是字典");
        return @{};
    }
}

+ (nullable NSString *)dictionaryToJsonString:(nullable NSDictionary *)dictionary {
    if (!dictionary || ![dictionary isKindOfClass:[NSDictionary class]]) {
        NSLog(@"[JSONUtils] 输入的字典为 nil 或不是 NSDictionary 类型");
        return nil;
    }
    
    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:&error];
    
    if (error) {
        NSLog(@"[JSONUtils] 无法将字典转换为 JSON 数据: %@", error.localizedDescription);
        return nil;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    
    if (jsonString.length <= 0) {
        return nil;
    }
    
    return jsonString;
}

@end
