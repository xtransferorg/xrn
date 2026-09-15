//
//  XRNBundleModule.h
//  react-native-xrn-bundle
//
//  Created by  xtgq on 2025/5/14.
//

#import <XRNBundleModuleSpec/XRNBundleModuleSpec.h>

NS_ASSUME_NONNULL_BEGIN

@interface XRNBundleModule : NSObject<NativeXRNBundleModuleSpec>

- (id)preLoadBundle:(NSString *)bundleName;
- (id)releaseBundle:(NSString *)bundleName;
- (id)releaseBundleForce:(NSString *)bundleName;

@end

NS_ASSUME_NONNULL_END
