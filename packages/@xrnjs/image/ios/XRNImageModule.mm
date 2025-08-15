
#import <React/RCTViewManager.h>
#import "RCTConvert+ExpoImage.h"

@interface RCT_EXTERN_MODULE(XRNImageView, RCTViewManager)

// Events
// 这里需要使用 RCTDirectEventBlock，  这里参考是 RCTImageView 中 使用的是RCTDirectEventBlock； 这里如果使用 RCTBubblingEventBlock，还会存在运行时报错
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onDisplay, RCTDirectEventBlock);

// js 属性名为source  native 属性名为sources
RCT_REMAP_VIEW_PROPERTY(source, sources, ExpoImageSourceArray);
// js 属性名为placeholder  native 属性名为placeholderSources
RCT_REMAP_VIEW_PROPERTY(placeholder, placeholderSources, ExpoImageSourceArray);
RCT_EXPORT_VIEW_PROPERTY(contentFit, ExpoImageContentFit);
RCT_EXPORT_VIEW_PROPERTY(placeholderContentFit, ExpoImageContentFit);
RCT_EXPORT_VIEW_PROPERTY(contentPosition, ExpoImageContentPosition);
RCT_EXPORT_VIEW_PROPERTY(transition, ExpoImageTransition);
RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat);
// js 属性名为tintColor  native 属性名为imageTintColor
RCT_REMAP_VIEW_PROPERTY(tintColor, imageTintColor, UIColor);
#warning 这个priority不知道怎么写 [目前看来只需要写对应的setter方法即可，待测试]
RCT_EXPORT_VIEW_PROPERTY(priority, ExpoImagePriority);
RCT_EXPORT_VIEW_PROPERTY(cachePolicy, ExpoImageCachePolicy);
RCT_EXPORT_VIEW_PROPERTY(enableLiveTextInteraction, BOOL);
#warning 这个accessible不知道怎么写 [目前看来只需要写对应的setter方法即可，待测试]
RCT_EXPORT_VIEW_PROPERTY(accessible, BOOL);
#warning 这个accessibilityLabel不知道怎么写 [这里碰到一个accessibilityLabel 和系统属性重名问题，这用REMAP的方式解决试试]
RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, xtAccessibilityLabel, NSString);
RCT_EXPORT_VIEW_PROPERTY(recyclingKey, NSString);
RCT_EXPORT_VIEW_PROPERTY(allowDownscaling, BOOL);
RCT_EXPORT_VIEW_PROPERTY(autoplay, BOOL);

//UIMethod
RCT_EXTERN_METHOD(startAnimating:(nonnull NSNumber *)reactTag);
RCT_EXTERN_METHOD(stopAnimating:(nonnull NSNumber *)reactTag);


//Not UIMethod
#warning RCTConvert貌似支持[URL]/URL/CGSize类型，但是这样写是否允许，有待确认，先这样写；如果不行到之后强制使用RCTConvert NSURLArray 进行转换
RCT_EXTERN_METHOD(prefetch:(nonnull NSArray<NSURL *> *)urls
                  cachePolicy:(nonnull ExpoImageCachePolicy)cachePolicy
                  headersMap:(nullable NSDictionary *)headersMap
                  resolver:(nonnull RCTPromiseResolveBlock)resolve
                  rejecter:(nonnull RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateBlurhashAsync:(nonnull NSURL *)url
                  numberOfComponents:(nonnull CGSize)numberOfComponents
                  resolver:(nonnull RCTPromiseResolveBlock)resolve
                  rejecter:(nonnull RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearMemoryCache:(nonnull RCTPromiseResolveBlock)resolve
                  rejecter:(nonnull RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearDiskCache:(nonnull RCTPromiseResolveBlock)resolve
                  rejecter:(nonnull RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCachePathAsync:(nonnull NSString *)cacheKey
                  resolver:(nonnull RCTPromiseResolveBlock)resolve
                  rejecter:(nonnull RCTPromiseRejectBlock)reject)


@end
