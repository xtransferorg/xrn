//
//  RNPAssetsLoad.m
//  RNPlayground
//
//  Created by 邓博 on 2020/5/28.
//

#import "RNPAssetsLoad.h"

@implementation RNPAssetsLoad


- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNAssetLoaderModuleSpecJSI>(params);
}

RCT_EXPORT_MODULE()

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isFileExist:(NSString *)filePath)
{
    if([filePath hasPrefix:@"file://"]){
      filePath = [filePath substringFromIndex:6];
    }
    NSString *encodingPath = [filePath stringByRemovingPercentEncoding];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL fileExists = [fileManager fileExistsAtPath:encodingPath];

    return @(fileExists);
}

RCT_EXPORT_METHOD(searchDrawableFile:(NSString * _Nullable)jsBundleFilePath callback:(RCTResponseSenderBlock)callback) {
    if([jsBundleFilePath hasPrefix:@"file://"]){
      jsBundleFilePath = [jsBundleFilePath substringFromIndex:6];
    }
    NSString *encodingPath = [jsBundleFilePath stringByRemovingPercentEncoding];
    NSString *assetPath = [[encodingPath stringByDeletingLastPathComponent] stringByAppendingPathComponent:@"assets"];
    NSString *imgPath;
    NSFileManager *fm;
    NSDirectoryEnumerator *dirEnum;
    fm = [NSFileManager defaultManager];
    dirEnum = [fm enumeratorAtPath:assetPath];
    NSMutableArray *imgArrays = [[NSMutableArray alloc]init];
    while ((imgPath = [dirEnum nextObject]) != nil){
        [imgArrays addObject:[assetPath stringByAppendingPathComponent:imgPath]];
    }
    callback(imgArrays);
}

RCT_EXPORT_METHOD(getCodePushRawResource:(NSString * _Nullable)jsBundlePath fileName:(NSString * _Nullable)fileName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  resolve(@"");
}

- (NSDictionary *)constantsToExport {
	return [self getConstants];
}

- (NSDictionary *)getConstants {
	return @{
		@"DefaultMainBundlePath": [[NSBundle mainBundle] bundlePath],
	};
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

@end