//
//  XTFileStoreTool.m
//  xtapp
//
//  Created by  xtgq on 2025/10/21.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTFileStoreTool.h"
#import "XTJSBundleTool.h"

@implementation XTFileStoreTool

// 返回形如 <Application Support>/<bundleID>/<version>/<env>/
+ (NSURL *)appSupportURL {
	
	NSURL *dir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].firstObject;

	NSError *err = nil;
	
	// App 包名目录
	NSString *bundleID = NSBundle.mainBundle.bundleIdentifier ?: @"com.xtapp.app";
	NSURL *bundleDir = [dir URLByAppendingPathComponent:bundleID isDirectory:YES];
	
	if (![NSFileManager.defaultManager fileExistsAtPath:bundleDir.path]) {
		[NSFileManager.defaultManager createDirectoryAtURL:bundleDir
							   withIntermediateDirectories:YES
												attributes:nil
													 error:&err];
	}
	
	// 版本号子目录
	NSString *version = [self currentAppVersion];
	NSURL *versionDir = [bundleDir URLByAppendingPathComponent:version isDirectory:YES];
	if (![NSFileManager.defaultManager fileExistsAtPath:versionDir.path]) {
		[NSFileManager.defaultManager createDirectoryAtURL:versionDir
							   withIntermediateDirectories:YES
												attributes:nil
													 error:&err];
	}
	
	// 环境子目录
	NSString *env = [[XTJSBundleTool shared] getEnvName];
	NSURL *envDir = [versionDir URLByAppendingPathComponent:env isDirectory:YES];
	if (![NSFileManager.defaultManager fileExistsAtPath:envDir.path]) {
		[NSFileManager.defaultManager createDirectoryAtURL:envDir
							   withIntermediateDirectories:YES
												attributes:nil
													 error:&err];
	}

	// 不备份到 iCloud
	[bundleDir setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
	[versionDir setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
	[envDir setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];

	return envDir;
}

+ (NSURL *)fileURL:(NSString *)filename {
	return [[self appSupportURL] URLByAppendingPathComponent:filename];
}

+ (BOOL)saveJSONObject:(id)obj filename:(NSString *)filename error:(NSError **)error {
	
	if (!obj || !filename.length) {
		return NO;
	}
	
	if (![NSJSONSerialization isValidJSONObject:obj]) {
		if (error) {
			*error = [NSError errorWithDomain:@"xt.json.store" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"对象不是合法 JSON"}];
		}
		return NO;
	}
	
	NSData *data = [NSJSONSerialization dataWithJSONObject:obj options:NSJSONWritingPrettyPrinted error:error];
	
	if (!data) {
		return NO;
	}
	
	NSURL *url = [self fileURL:filename];
	
	return [data writeToURL:url options:NSDataWritingAtomic error:error];
}

+ (id)loadJSONObjectWithFilename:(NSString *)filename error:(NSError **)error {
	
	NSURL *url = [self fileURL:filename];
	NSData *data = [NSData dataWithContentsOfURL:url options:0 error:error];
	
	if (!data) {
		return nil;
	}
	
	return [NSJSONSerialization JSONObjectWithData:data options:0 error:error];
}

+ (NSString *)currentAppVersion {
	NSString *version = NSBundle.mainBundle.infoDictionary[@"CFBundleShortVersionString"];
	
	if (version.length == 0) {
		version = NSBundle.mainBundle.infoDictionary[@"CFBundleVersion"] ?: @"0";
	}
	
	return version;
}

@end
