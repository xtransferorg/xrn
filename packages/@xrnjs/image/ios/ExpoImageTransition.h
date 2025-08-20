//
//  ExpoImageTransition.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ExpoImageEnums.h"
NS_ASSUME_NONNULL_BEGIN
NS_SWIFT_NAME(ImageTransition)
@interface ExpoImageTransition : NSObject

@property (nonatomic, assign) double duration;
@property (nonatomic, assign) ExpoImageTransitionTiming timing;
@property (nonatomic, assign) ExpoImageTransitionEffect effect;

- (UIViewAnimationOptions)toAnimationOptions;

@end

NS_ASSUME_NONNULL_END
