// Copyright 2022-present 650 Industries. All rights reserved.

/*
@objc(ExpoImageSource)
class ImageSource: NSObject {

  @objc var width: Double = 0.0

  @objc var height: Double = 0.0

  @objc var uri: URL? = nil

  #warning("js端没看到明显的属性对应，在js中ImageSource中，不管，先写上")
  @objc var scale: Double = 1.0

  @objc var headers: [String: String]?

  @objc var cacheKey: String?

  var pixelCount: Double {
    return width * height * scale * scale
  }

  var isBlurhash: Bool {
    return uri?.scheme == "blurhash"
  }

  var isThumbhash: Bool {
    return uri?.scheme == "thumbhash"
  }

  var isPhotoLibraryAsset: Bool {
    return isPhotoLibraryAssetUrl(uri)
  }

  var isCachingAllowed: Bool {
    // TODO: Don't cache other non-network requests (e.g. data URIs, local files)
    return !isPhotoLibraryAsset
  }
}

*/
