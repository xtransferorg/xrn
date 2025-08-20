//
//  ExpoImageSource.m
//  RNImageDemo
//
//  Created by  liyuan on 2024/11/30.
//

#import "ExpoImageSource.h"

@implementation ExpoImageSource

- (instancetype)init {
    self = [super init];
    if (self) {
        _width = 0.0;
        _height = 0.0;
        _scale = 1.0;
    }
    return self;
}

- (double)pixelCount {
    return self.width * self.height * self.scale * self.scale;
}

- (BOOL)isBlurhash {
    return [self.uri.scheme isEqualToString:@"blurhash"];
}

- (BOOL)isThumbhash {
    return [self.uri.scheme isEqualToString:@"thumbhash"];
}

- (BOOL)isPhotoLibraryAsset {
    return [self isPhotoLibraryAssetUrl:self.uri];
}

- (BOOL)isCachingAllowed {
    // TODO: Don't cache other non-network requests (e.g., data URIs, local files)
    return !self.isPhotoLibraryAsset;
}

- (BOOL)isPhotoLibraryAssetUrl:(NSURL *)url {
  return [url.scheme isEqualToString:@"ph"];
}

@end
