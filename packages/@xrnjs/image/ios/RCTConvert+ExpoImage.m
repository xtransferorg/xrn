//
//  RCTConvert+ExpoImage.m
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/12.
//

#import "RCTConvert+ExpoImage.h"
#import "ExpoImageSource.h"
#import "ExpoImageTransition.h"
#import "ExpoImageContentPosition.h"
@implementation RCTConvert (ExpoImage)

// 枚举默认值定义
// https://docs.expo.dev/versions/latest/sdk/image/
RCT_ENUM_CONVERTER(
                   ExpoImageContentFit,
                   (@{
                    @"contain" : @(ExpoImageContentFitContain),
                    @"cover" : @(ExpoImageContentFitCover),
                    @"fill" : @(ExpoImageContentFitFill),
                    @"none" : @(ExpoImageContentFitNone),
                    @"scale-down" : @(ExpoImageContentFitScaleDown),
                   }),
                   ExpoImageContentFitCover,
                   integerValue)

RCT_ENUM_CONVERTER(
                   ExpoImagePriority,
                   (@{
                    @"low" : @(ExpoImagePriorityLow),
                    @"normal" : @(ExpoImagePriorityNormal),
                    @"high" : @(ExpoImagePriorityHigh),
                   }),
                   ExpoImagePriorityNormal,
                   integerValue)

RCT_ENUM_CONVERTER(
                   ExpoImageCachePolicy,
                   (@{
                    @"none" : @(ExpoImageCachePolicyNone),
                    @"disk" : @(ExpoImageCachePolicyDisk),
                    @"memory" : @(ExpoImageCachePolicyMemory),
                    @"memory-disk" : @(ExpoImageCachePolicyMemoryAndDisk),
                   }),
                   ExpoImageCachePolicyDisk,
                   integerValue)

RCT_ENUM_CONVERTER(
                   ExpoImageTransitionTiming,
                   (@{
                    @"ease-in-out" : @(ExpoImageTransitionTimingEaseInOut),
                    @"ease-in" : @(ExpoImageTransitionTimingEaseIn),
                    @"ease-out" : @(ExpoImageTransitionTimingEaseOut),
                    @"linear" : @(ExpoImageTransitionTimingLinear),
                   }),
                   ExpoImageTransitionTimingEaseInOut,
                   integerValue)

RCT_ENUM_CONVERTER(
                   ExpoImageTransitionEffect,
                   (@{
                    @"cross-dissolve" : @(ExpoImageTransitionEffectCrossDissolve),
                    @"flip-from-top" : @(ExpoImageTransitionEffectFlipFromTop),
                    @"flip-from-right" : @(ExpoImageTransitionEffectFlipFromRight),
                    @"flip-from-bottom" : @(ExpoImageTransitionEffectFlipFromBottom),
                    @"flip-from-left" : @(ExpoImageTransitionEffectFlipFromLeft),
                    @"curl-up" : @(ExpoImageTransitionEffectCurlUp),
                    @"curl-down" : @(ExpoImageTransitionEffectCurlDown),
                   }),
                   ExpoImageTransitionEffectCrossDissolve,
                   integerValue)

// 数组支持，因为sources需要
RCT_ARRAY_CONVERTER(ExpoImageSource)

+ (ExpoImageSource *)ExpoImageSource:(id)json {
  if (!json) {
      return nil;
  }
  // 这里不用判空，如果 json[@"width"] 如果是 nil，nil.doubleValue 会得到0.0，恰好这里默认值就是0.0
  double width = [self double:json[@"width"]];
  double height = [self double:json[@"height"]];
  NSURL *uri = [self NSURL:json[@"uri"]];
  double scale = [self double:json[@"scale"]];
  if (!json[@"scale"]) {
    scale = 1; // 默认值是1
  }
  NSDictionary *headers = [self NSDictionary:json[@"headers"]];
  if (headers) {
      __block BOOL allHeadersAreStrings = YES;
      [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id header, BOOL *stop) {
          if (![header isKindOfClass:[NSString class]]) {
              RCTLogError(@"ExpoImageSource Values of HTTP headers passed must be  of type string. "
                          "Value of header '%@' is not a string.", key);
              allHeadersAreStrings = NO;
              *stop = YES;
          }
      }];
      if (!allHeadersAreStrings) {
          // Set headers to nil here to avoid crashing later.
          headers = nil;
      }
  }
  NSString *cacheKey = [self NSString:json[@"cacheKey"]];
  
  ExpoImageSource *imageSource= [[ExpoImageSource alloc] init];
  imageSource.width = width;
  imageSource.height = height;
  imageSource.uri = uri;
  imageSource.scale = scale;
  imageSource.headers = headers;
  imageSource.cacheKey = cacheKey;
  return imageSource;
}

+ (ExpoImageTransition *)ExpoImageTransition:(id)json {
  if (!json) {
      return nil;
  }
  
  double duration = [self double:json[@"duration"]];
  if (!json[@"duration"]) {
    duration = 100; // 默认值是100
  }
  
  ExpoImageTransitionTiming timing = [self ExpoImageTransitionTiming:json[@"timing"]];
  ExpoImageTransitionEffect effect = [self ExpoImageTransitionEffect:json[@"effect"]];
  
  ExpoImageTransition *imageTransition = [[ExpoImageTransition alloc] init];
  imageTransition.duration = duration;
  imageTransition.timing = timing;
  imageTransition.effect = effect;
  return imageTransition;
}

+ (ExpoImageContentPosition *)ExpoImageContentPosition:(id)json {
  if (!json) {
      return nil;
  }
  ExpoImageContentPosition *contentPosition = [[ExpoImageContentPosition alloc] init];
  
  if (json[@"top"]) {
    contentPosition.top = [[ExpoImageContentPositionValue alloc] initWithValue:json[@"top"]];
  }
  
  if (json[@"left"]) {
    contentPosition.left = [[ExpoImageContentPositionValue alloc] initWithValue:json[@"left"]];
  }
  
  if (json[@"bottom"]) {
    contentPosition.bottom = [[ExpoImageContentPositionValue alloc] initWithValue:json[@"bottom"]];
  }
  
  if (json[@"right"]) {
    contentPosition.right = [[ExpoImageContentPositionValue alloc] initWithValue:json[@"right"]];
  }
  
  return contentPosition;
}

@end
