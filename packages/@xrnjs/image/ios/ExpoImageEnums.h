//
//  ExpoImageEnums.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/12.
//

#ifndef ExpoImageEnums_h
#define ExpoImageEnums_h

/**
 Describes how the image should be resized to fit its container.
 - Note: It mirrors the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property.
 */
typedef NS_ENUM(NSInteger, ExpoImageContentFit) {
  /**
   The image is scaled to maintain its aspect ratio while fitting within the container's box.
   The entire image is made to fill the box, while preserving its aspect ratio,
   so the image will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
   */
  ExpoImageContentFitContain,
  /**
   The image is sized to maintain its aspect ratio while filling the element's entire content box.
   If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
   */
  ExpoImageContentFitCover,
  /**
   The image is sized to fill the element's content box. The entire object will completely fill the box.
   If the image's aspect ratio does not match the aspect ratio of its box, then the image will be stretched to fit.
   */
  ExpoImageContentFitFill,
  /**
   The image is not resized and is centered by default.
   When specified, the exact position can be controlled with `ContentPosition`.
   */
  ExpoImageContentFitNone,
  /**
   The image is sized as if `none` or `contain` were specified,
   whichever would result in a smaller concrete image size.
   */
  ExpoImageContentFitScaleDown
};

typedef NS_ENUM(NSInteger, ExpoImagePriority) {
  ExpoImagePriorityLow,
  ExpoImagePriorityNormal,
  ExpoImagePriorityHigh
};

typedef NS_ENUM(NSInteger, ExpoImageCachePolicy) {
  ExpoImageCachePolicyNone,
  ExpoImageCachePolicyDisk,
  ExpoImageCachePolicyMemory,
  ExpoImageCachePolicyMemoryAndDisk
};

typedef NS_ENUM(NSInteger, ExpoImageTransitionTiming) {
  ExpoImageTransitionTimingEaseInOut,
  ExpoImageTransitionTimingEaseIn,
  ExpoImageTransitionTimingEaseOut,
  ExpoImageTransitionTimingLinear
};

typedef NS_ENUM(NSInteger, ExpoImageTransitionEffect) {
  ExpoImageTransitionEffectCrossDissolve,
  ExpoImageTransitionEffectFlipFromTop,
  ExpoImageTransitionEffectFlipFromRight,
  ExpoImageTransitionEffectFlipFromBottom,
  ExpoImageTransitionEffectFlipFromLeft,
  ExpoImageTransitionEffectCurlUp,
  ExpoImageTransitionEffectCurlDown
};

#endif /* ExpoImageEnums_h */
