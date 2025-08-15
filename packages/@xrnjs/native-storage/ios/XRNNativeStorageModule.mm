#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(XRNNativeStorageModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXTERN_METHOD(getItem:(NSString *)key
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setItem:(NSString *)key value:(NSString *)value withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeItem:(NSString *)key withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getItemSync:(NSString *)key)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setItemSync:(NSString *)key value:(NSString *)value)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(removeItemSync:(NSString *)key)

@end
