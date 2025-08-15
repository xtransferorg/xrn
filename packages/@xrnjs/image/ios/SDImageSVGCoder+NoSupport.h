//
//  SDImageSVGCoder+NoSupport.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/12/3.
//


#import <SDWebImageSVGCoder/SDWebImageSVGCoder.h>

NS_ASSUME_NONNULL_BEGIN

@interface SDImageSVGCoder (NoSupport)

+ (BOOL)containsNoSupportTagInData:(nullable NSData *)data;

@end

NS_ASSUME_NONNULL_END
