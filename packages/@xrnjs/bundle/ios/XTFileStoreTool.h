//
//  XTFileStoreTool.h
//  xtapp
//
//  Created by  xtgq on 2025/10/21.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTFileStoreTool : NSObject

+ (BOOL)saveJSONObject:(id)obj filename:(NSString *)filename error:(NSError **)error;

+ (nullable id)loadJSONObjectWithFilename:(NSString *)filename error:(NSError **)error;

@end
NS_ASSUME_NONNULL_END

