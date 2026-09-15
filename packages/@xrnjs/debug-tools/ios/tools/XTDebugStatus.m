//
//  XTDebugStatus.m
//  xtapp
//
//  Created by  xupeng on 2025/11/17.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTDebugStatus.h"

@implementation XTDebugStatus

static NSString *const xtEnableDebug = @"enableDebug";
static NSString *const xtEnableCommon = @"enableCommon";
static NSString *const xtEnableCodePush = @"enableCodepush";

+ (XTDebugStatus *)shared {
    static XTDebugStatus *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[XTDebugStatus alloc] init];
    });
    return sharedInstance;
}

- (BOOL)getDebugStatus:(NSString *)bundleName {
    NSDictionary<NSString *, id> *debugInfo = [self getDebugInfo:bundleName];
    NSString *enableDebug = debugInfo[xtEnableDebug];
    return [enableDebug isKindOfClass:[NSString class]] && [enableDebug isEqualToString:@"1"];
}

- (BOOL)getCommonStatus:(NSString *)bundleName {
    BOOL supportCommon = YES;
    NSDictionary<NSString *, id> *debugInfo = [self getDebugInfo:bundleName];
    if ([debugInfo.allKeys containsObject:xtEnableCommon] &&
        [debugInfo[xtEnableCommon] isEqualToString:@"0"]) {
        supportCommon = NO;
    }
    return supportCommon;
}

- (BOOL)getCodepushStatus:(NSString *)bundleName {
    NSDictionary<NSString *, id> *debugInfo = [self getDebugInfo:bundleName];
    NSString *enableCodePush = debugInfo[xtEnableCodePush];
    return [enableCodePush isKindOfClass:[NSString class]] && [enableCodePush isEqualToString:@"1"];
}

- (NSDictionary<NSString *, id> *)getDebugInfo:(NSString *)bundleName {
    NSString *key = [NSString stringWithFormat:@"%@-debug", bundleName];
    
    // 检查 key 是否存在
    if (![[NSUserDefaults standardUserDefaults] objectForKey:key]) {
        return @{};
    }
    
    // 获取字符串值
    NSString *debugInfoStr = [[NSUserDefaults standardUserDefaults] stringForKey:key];
    if (!debugInfoStr) {
        return @{};
    }
    
    // 转换为 Data
    NSData *data = [debugInfoStr dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) {
        return @{};
    }
    
    // 解析 JSON
    NSError *error;
    id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    
    if (error || ![jsonObject isKindOfClass:[NSDictionary class]]) {
        return @{};
    }
    
    return (NSDictionary<NSString *, id> *)jsonObject;
}

- (void)saveDebugInfo:(NSString *)bundleName debugInfo:(NSDictionary<NSString *, id> *)debugInfo {
    NSString *key = [NSString stringWithFormat:@"%@-debug", bundleName];
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:debugInfo options:0 error:&error];
    
    if (error) {
        NSLog(@"JSON 序列化失败: %@", error);
        return;
    }
    
    if (jsonData) {
        NSString *updatedBundleStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if (updatedBundleStr) {
            [[NSUserDefaults standardUserDefaults] setValue:updatedBundleStr forKey:key];
            [[NSUserDefaults standardUserDefaults] synchronize];
        }
    }
}

- (void)cleanDebugInfo:(NSString *)bundleName {
    NSString *key = [NSString stringWithFormat:@"%@-debug", bundleName];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

@end
