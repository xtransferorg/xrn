//
//  ExpoImageTransition.m
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import "ExpoImageTransition.h"

@implementation ExpoImageTransition

// Initializer
- (instancetype)init {
    self = [super init];
    if (self) {
        _duration = 100.0; // Default value
        _timing = ExpoImageTransitionTimingEaseInOut;
        _effect = ExpoImageTransitionEffectCrossDissolve;
    }
    return self;
}

// Method to convert to animation options
- (UIViewAnimationOptions)toAnimationOptions {
    UIViewAnimationOptions options = 0;
    
    // Convert timing to animation options
    switch (self.timing) {
        case ExpoImageTransitionTimingEaseInOut:
            options |= UIViewAnimationOptionCurveEaseInOut;
            break;
        case ExpoImageTransitionTimingEaseIn:
            options |= UIViewAnimationOptionCurveEaseIn;
            break;
        case ExpoImageTransitionTimingEaseOut:
            options |= UIViewAnimationOptionCurveEaseOut;
            break;
        case ExpoImageTransitionTimingLinear:
            options |= UIViewAnimationOptionCurveLinear;
            break;
    }
    
    // Convert effect to animation options
    switch (self.effect) {
        case ExpoImageTransitionEffectCrossDissolve:
            options |= UIViewAnimationOptionTransitionCrossDissolve;
            break;
        case ExpoImageTransitionEffectFlipFromLeft:
            options |= UIViewAnimationOptionTransitionFlipFromLeft;
            break;
        case ExpoImageTransitionEffectFlipFromRight:
            options |= UIViewAnimationOptionTransitionFlipFromRight;
            break;
        case ExpoImageTransitionEffectFlipFromTop:
            options |= UIViewAnimationOptionTransitionFlipFromTop;
            break;
        case ExpoImageTransitionEffectFlipFromBottom:
            options |= UIViewAnimationOptionTransitionFlipFromBottom;
            break;
        case ExpoImageTransitionEffectCurlUp:
            options |= UIViewAnimationOptionTransitionCurlUp;
            break;
        case ExpoImageTransitionEffectCurlDown:
            options |= UIViewAnimationOptionTransitionCurlDown;
            break;
    }
    
    return options;
}

@end
