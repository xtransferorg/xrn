//
//  SDImageSVGCoder+NoSupport.m
//  RNImageDemo
//
//  Created by  liyuan on 2024/12/3.
//

#import "SDImageSVGCoder+NoSupport.h"

@implementation SDImageSVGCoder (NoSupport)

+ (NSArray <NSString *>*)noSupportTags {
  return @[@"</pattern>"];
}

+ (BOOL)containsNoSupportTagInData:(nullable NSData *)data {
  if (!data) {
    return NO;
  }
  
  BOOL contain = NO;
  for (NSString *noSupportTag in [self noSupportTags]) {
    NSRange range = [data rangeOfData:[noSupportTag dataUsingEncoding:NSUTF8StringEncoding] options:0 range:NSMakeRange(0, data.length)];
    if (range.location != NSNotFound) {
      contain = YES;
      break;
    }
  }
  
  return contain;
}

@end
