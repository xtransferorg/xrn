#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(XRNNetworkModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
