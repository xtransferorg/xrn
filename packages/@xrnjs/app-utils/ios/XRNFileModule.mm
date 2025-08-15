//
//  XRNFileModule.m
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(XRNFileModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// 清除文件缓存，目前只有Android端有实现，iOS端空实现
RCT_EXTERN_METHOD(clearFrescoCache:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)


// 插入图片到系统图库，目前只有Android端有实现，iOS端空实现
RCT_EXTERN_METHOD(insertImageToPhotoLibrary:(NSString *)path
				  fileName:(NSString *)fileName
				  withResolver:(RCTPromiseResolveBlock)resolve
				  withRejecter:(RCTPromiseRejectBlock)reject)
@end
