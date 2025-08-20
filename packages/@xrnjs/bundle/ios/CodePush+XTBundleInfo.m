//
//  CodePush+XTBundleinfo.m
//  xtapp
//
//  Created by  xtgq on 2024/6/6.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "CodePush+XTBundleInfo.h"

@implementation CodePush (XTBundleInfo)

static NSString *const StatusFile = @"codepush.json";
static NSString *const UpdateMetadataFileName = @"app.json";

+ (NSDictionary *)getPackageForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSString *packageHash = [self getPackageHashForDeploymentKey:deploymentKey error:error];
  if (!packageHash) {
    return nil;
  }
  
  return [self getPackage:packageHash deploymentKey:deploymentKey error:error];
}

+ (NSDictionary *)getPackage:(NSString *)packageHash
               deploymentKey:(NSString *)deploymentKey
                       error:(NSError **)error
{
  NSString *updateDirectoryPath = [self getPackageFolderPath:packageHash deploymentKey:deploymentKey];
  NSString *updateMetadataFilePath = [updateDirectoryPath stringByAppendingPathComponent:UpdateMetadataFileName];
  
  if (![[NSFileManager defaultManager] fileExistsAtPath:updateMetadataFilePath]) {
    return nil;
  }
  
  NSString *updateMetadataString = [NSString stringWithContentsOfFile:updateMetadataFilePath
                                                             encoding:NSUTF8StringEncoding
                                                                error:error];
  if (!updateMetadataString) {
    return nil;
  }
  
  NSData *updateMetadata = [updateMetadataString dataUsingEncoding:NSUTF8StringEncoding];
  return [NSJSONSerialization JSONObjectWithData:updateMetadata
                                         options:kNilOptions
                                           error:error];
}

+ (NSString *)getPackageFolderPath:(NSString *)packageHash deploymentKey:(NSString *)deploymentKey
{
  return [[self getCodePushPathForDeploymentKey:deploymentKey] stringByAppendingPathComponent:packageHash];
}

+ (NSString *)getPackageHashForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSDictionary *info = [self getCurrentPackageInfoForDeploymentKey:deploymentKey error:error];
  if (!info) {
    return nil;
  }
  
  return info[@"currentPackage"];
}

+ (NSMutableDictionary *)getCurrentPackageInfoForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSString *statusFilePath = [self getStatusFilePath:deploymentKey];
  if (![[NSFileManager defaultManager] fileExistsAtPath:statusFilePath]) {
    return [NSMutableDictionary dictionary];
  }
  
  NSString *content = [NSString stringWithContentsOfFile:statusFilePath
                                                encoding:NSUTF8StringEncoding
                                                   error:error];
  if (!content) {
    return nil;
  }
  
  NSData *data = [content dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary* json = [NSJSONSerialization JSONObjectWithData:data
                                                       options:kNilOptions
                                                         error:error];
  if (!json) {
    return nil;
  }
  
  return [json mutableCopy];
}

+ (NSString *)getStatusFilePath:(NSString *)deploymentKey
{
  return [[self getCodePushPathForDeploymentKey:deploymentKey] stringByAppendingPathComponent:StatusFile];
}

+ (NSString *)getCodePushPathForDeploymentKey:(NSString *)deploymentKey
{
  NSString* deploymentKeyCodePush = [NSString stringWithFormat:@"%@%@", deploymentKey, @"CodePush"];
  NSString* codePushPath = [[CodePush getApplicationSupportDirectory] stringByAppendingPathComponent:deploymentKeyCodePush];
  if ([CodePush isUsingTestConfiguration]) {
    codePushPath = [codePushPath stringByAppendingPathComponent:@"TestPackages"];
  }
  
  return codePushPath;
}

+ (NSDictionary *)getPreviousPackageForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSString *packageHash = [self getPreviousPackageHashForDeploymentKey:deploymentKey error:error];
  if (!packageHash) {
    return nil;
  }
  
  return [self getPackage:packageHash deploymentKey:deploymentKey error:error];
}

+ (NSString *)getPreviousPackageHashForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSDictionary *info = [self getCurrentPackageInfoForDeploymentKey:deploymentKey error:error];
  if (!info) {
    return nil;
  }
  
  return info[@"previousPackage"];
}

+ (NSMutableDictionary *)getPackageInfoForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error
{
  NSString *statusFilePath = [self getStatusFilePath:deploymentKey];
  if (![[NSFileManager defaultManager] fileExistsAtPath:statusFilePath]) {
    return [NSMutableDictionary dictionary];
  }
  
  NSString *content = [NSString stringWithContentsOfFile:statusFilePath
                                                encoding:NSUTF8StringEncoding
                                                   error:error];
  if (!content) {
    return nil;
  }
  
  NSData *data = [content dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary* json = [NSJSONSerialization JSONObjectWithData:data
                                                       options:kNilOptions
                                                         error:error];
  if (!json) {
    return nil;
  }
  
  return [json mutableCopy];
}

@end
