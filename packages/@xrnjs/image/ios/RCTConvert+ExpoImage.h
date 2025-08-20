//
//  RCTConvert+ExpoImage.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/12.
//

#import <React/RCTConvert.h>
#import "ExpoImageEnums.h"
NS_ASSUME_NONNULL_BEGIN
@class ExpoImageSource, ExpoImageTransition, ExpoImageContentPosition;
@interface RCTConvert (ExpoImage)

+ (ExpoImageContentFit)ExpoImageContentFit:(id)json;
+ (ExpoImagePriority)ExpoImagePriority:(id)json;
+ (ExpoImageCachePolicy)ExpoImageCachePolicy:(id)json;
+ (ExpoImageTransitionTiming)ExpoImageTransitionTiming:(id)json;
+ (ExpoImageTransitionEffect)ExpoImageTransitionEffect:(id)json;
+ (NSArray<ExpoImageSource *> *)ExpoImageSourceArray:(id)json;
+ (ExpoImageSource *)ExpoImageSource:(id)json;
+ (ExpoImageTransition *)ExpoImageTransition:(id)json;
+ (ExpoImageContentPosition *)ExpoImageContentPosition:(id)json;

@end

NS_ASSUME_NONNULL_END
