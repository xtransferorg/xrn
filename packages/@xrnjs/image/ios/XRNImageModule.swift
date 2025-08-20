// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import SDWebImageWebPCoder
import SDWebImageAVIFCoder
import SDWebImageSVGCoder
private var isloadXRNImage = false
private let loadXRNImageLockObject = NSObject()

@objc(XRNImageView)
public final class XRNImageViewManager: RCTViewManager {
  lazy var prefetcher = SDWebImagePrefetcher.shared

  public override init() {
    objc_sync_enter(loadXRNImageLockObject)
    if !isloadXRNImage {
      XRNImageViewManager.registerCoders()
      XRNImageViewManager.registerLoaders()
      isloadXRNImage = true
    }
    objc_sync_exit(loadXRNImageLockObject)
  }
  
  public override class func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  public override class func moduleName() -> String! {
    return "XRNImageView"
  }
  
  public override func view() -> UIView! {
    return ImageView()
  }
  
  @objc(prefetch:cachePolicy:headersMap:resolver:rejecter:)
  func prefetch(urls: [URL],
                cachePolicy: ExpoImageCachePolicy,
                headersMap: [String: String]?,
                resolve: @escaping RCTPromiseResolveBlock,
                reject: @escaping RCTPromiseRejectBlock) {
    var context = SDWebImageContext()
    let sdCacheType = cachePolicy.toSdCacheType().rawValue
    context[.queryCacheType] = SDImageCacheType.none.rawValue
    context[.storeCacheType] = SDImageCacheType.none.rawValue
    context[.originalQueryCacheType] = sdCacheType
    context[.originalStoreCacheType] = sdCacheType
    
    var imagesLoaded = 0
    var failed = false
    
    if headersMap != nil {
      context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headersMap)
    }
    
    urls.forEach { url in
      SDWebImagePrefetcher.shared.prefetchURLs([url], context: context, progress: nil, completed: { _, skipped in
        if skipped > 0 && !failed {
          failed = true
          resolve(false)
        } else {
          imagesLoaded = imagesLoaded + 1
          if imagesLoaded == urls.count {
            resolve(true)
          }
        }
      })
    }
  }
  
  @objc(generateBlurhashAsync:numberOfComponents:resolver:rejecter:)
  func generateBlurhashAsync(url: URL,
                             numberOfComponents: CGSize,
                             resolve: @escaping RCTPromiseResolveBlock,
                             reject: @escaping RCTPromiseRejectBlock) {
    let downloader = SDWebImageDownloader()
    let parsedNumberOfComponents = (Int(numberOfComponents.width), Int(numberOfComponents.height))
    downloader.downloadImage(with: url, progress: nil, completed: { image, _, _, _ in
      DispatchQueue.global().async {
        if let downloadedImage = image {
          let blurhashString = blurhash(fromImage: downloadedImage, numberOfComponents: parsedNumberOfComponents)
          resolve(blurhashString)
        } else {
          #warning("这里转化成普通的error格式可能有要求，要和JS端对应，ERR_BLURHASH_GENERATION，这是chatgpt根据函数定义转成的字符串")
          // An exception to throw when it its not possible to generate a blurhash for a given URL.
          let error = NSError(domain: "www.xtransfer.com.expoimage", code: -1024, userInfo: nil) as Error
          reject("ERR_BLURHASH_GENERATION", "Unable to generate blurhash, make sure the image exists at the given URL", error)
        }
      }
    })
  }
  
  @objc(clearMemoryCache:rejecter:)
  func clearMemoryCache(resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    SDImageCache.shared.clearMemory()
    resolve(true)
  }
  
  @objc(clearDiskCache:rejecter:)
  func clearDiskCache(resolve: @escaping RCTPromiseResolveBlock,
                      reject: @escaping RCTPromiseRejectBlock) {
    SDImageCache.shared.clearDisk {
      resolve(true)
    }
  }
  
  @objc(getCachePathAsync:resolver:rejecter:)
  func getCachePathAsync(cacheKey: String,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    /*
     We need to check if the image exists in the cache first since `cachePath` will
     return a path regardless of whether or not the image exists.
     */
    SDImageCache.shared.diskImageExists(withKey: cacheKey) { exists in
      if exists {
        let cachePath = SDImageCache.shared.cachePath(forKey: cacheKey)

        resolve(cachePath)
      } else {
        resolve(nil)
      }
    }
  }
    
  @objc(startAnimating:)
  public func startAnimating(_ reactTag: NSNumber) {
      self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
          guard let view = viewRegistry?[reactTag] as? ImageView else {
              if (RCT_DEBUG == 1) {
                  print("Invalid view returned from registry, expecting ImageView")
              }
              return
          }

        view.sdImageView.startAnimating()
      }
  }
  
  @objc(stopAnimating:)
  public func stopAnimating(_ reactTag: NSNumber) {
      self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
          guard let view = viewRegistry?[reactTag] as? ImageView else {
              if (RCT_DEBUG == 1) {
                  print("Invalid view returned from registry, expecting ImageView")
              }
              return
          }

        view.sdImageView.stopAnimating()
      }
  }

  static func registerCoders() {
    if #available(iOS 14.0, tvOS 14.0, *) {
      // By default Animated WebP is not supported
      SDImageCodersManager.shared.addCoder(SDImageAWebPCoder.shared)
    } else {
      // This coder is much slower, but it's the only one that works in iOS 13
      SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
    }
    SDImageCodersManager.shared.addCoder(SDImageAVIFCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageSVGCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageHEICCoder.shared)
  }

  static func registerLoaders() {
    SDImageLoadersManager.shared.addLoader(BlurhashLoader())
    SDImageLoadersManager.shared.addLoader(ThumbhashLoader())
    SDImageLoadersManager.shared.addLoader(PhotoLibraryAssetLoader())
  }
}
