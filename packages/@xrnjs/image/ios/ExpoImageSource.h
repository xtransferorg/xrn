//
//  ExpoImageSource.h
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
NS_SWIFT_NAME(ImageSource)
@interface ExpoImageSource : NSObject

@property (nonatomic, assign) double width;
@property (nonatomic, assign) double height;
@property (nonatomic, strong, nullable) NSURL *uri;
@property (nonatomic, assign) double scale;
@property (nonatomic, strong, nullable) NSDictionary<NSString *, NSString *> *headers;
@property (nonatomic, strong, nullable) NSString *cacheKey;

@property (nonatomic, readonly) double pixelCount;
@property (nonatomic, readonly) BOOL isBlurhash;
@property (nonatomic, readonly) BOOL isThumbhash;
@property (nonatomic, readonly) BOOL isPhotoLibraryAsset;
@property (nonatomic, readonly) BOOL isCachingAllowed;

@end

NS_ASSUME_NONNULL_END
