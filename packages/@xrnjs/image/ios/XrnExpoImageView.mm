//
//  XrnExpoImageView.m
//  XrnExpoImage
//
//  Created by  xtgq on 2026/1/6.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIView.h>
#import "XrnExpoImageView.h"

#import "XrnExpoImage-Swift.h"
#import "ExpoImageSource.h"
#import "ExpoImageEnums.h"

namespace facebook::react {
struct XRNImageViewSourceHeadersStruct;
struct XRNImageViewPlaceholderHeadersStruct;
struct XRNImageViewSourceStruct;
struct XRNImageViewPlaceholderStruct;
struct XRNImageViewContentPositionStruct;
struct XRNImageViewTransitionStruct;

bool operator==(const XRNImageViewSourceHeadersStruct &, const XRNImageViewSourceHeadersStruct &);
bool operator==(const XRNImageViewPlaceholderHeadersStruct &, const XRNImageViewPlaceholderHeadersStruct &);
bool operator==(const XRNImageViewSourceStruct &, const XRNImageViewSourceStruct &);
bool operator==(const XRNImageViewPlaceholderStruct &, const XRNImageViewPlaceholderStruct &);
bool operator==(const XRNImageViewContentPositionStruct &, const XRNImageViewContentPositionStruct &);
bool operator==(const XRNImageViewTransitionStruct &, const XRNImageViewTransitionStruct &);
} // namespace facebook::react


#import <react/renderer/components/xrnimage/ComponentDescriptors.h>
#import <react/renderer/components/xrnimage/EventEmitters.h>
#import <react/renderer/components/xrnimage/Props.h>
#import <react/renderer/components/xrnimage/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import <React/RCTConversions.h>

using namespace facebook::react;
namespace facebook::react {

inline bool operator==(const XRNImageViewSourceStruct &lhs,
															const XRNImageViewSourceStruct &rhs) {
	return lhs.uri == rhs.uri &&
	lhs.headers == rhs.headers &&
	lhs.width == rhs.width &&
	lhs.height == rhs.height &&
	lhs.blurhash == rhs.blurhash &&
	lhs.thumbhash == rhs.thumbhash &&
	lhs.cacheKey == rhs.cacheKey &&
	lhs.isAnimated == rhs.isAnimated;
}

inline bool operator==(const XRNImageViewSourceHeadersStruct &lhs,
															const XRNImageViewSourceHeadersStruct &rhs) {
	return true;
}

inline bool operator==(const XRNImageViewPlaceholderStruct &lhs,
															const XRNImageViewPlaceholderStruct &rhs) {
	return lhs.uri == rhs.uri &&
	lhs.headers == rhs.headers &&
	lhs.width == rhs.width &&
	lhs.height == rhs.height &&
	lhs.blurhash == rhs.blurhash &&
	lhs.thumbhash == rhs.thumbhash &&
	lhs.cacheKey == rhs.cacheKey &&
	lhs.isAnimated == rhs.isAnimated;
}

inline bool operator==(const XRNImageViewPlaceholderHeadersStruct &lhs,
															const XRNImageViewPlaceholderHeadersStruct &rhs) {
	return true;
}

inline bool operator==(const XRNImageViewContentPositionStruct &lhs,
															const XRNImageViewContentPositionStruct &rhs) {
	return lhs.top == rhs.top &&
	lhs.bottom == rhs.bottom &&
	lhs.left == rhs.left &&
	lhs.right == rhs.right;
}

inline bool operator==(const XRNImageViewTransitionStruct &lhs,
															const XRNImageViewTransitionStruct &rhs) {
	return lhs.duration == rhs.duration;
}

} // namespace facebook::react

@interface XrnExpoImageView () <RCTXRNImageViewViewProtocol>

@end

@implementation XrnExpoImageView {
	ImageView *_imageView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
	return concreteComponentDescriptorProvider<XRNImageViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		
		static dispatch_once_t xrn_image_onceToken;
		dispatch_once(&xrn_image_onceToken, ^{
			[ImageModule new];
		});
		
		static const auto defaultProps = std::make_shared<const XRNImageViewProps>();
		_props = defaultProps;
		
		_imageView = [[ImageView alloc] initWithFrame:CGRectZero];
		
		self.contentView = _imageView;
	}
	
	return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
	const auto &oldViewProps = *std::static_pointer_cast<XRNImageViewProps const>(_props);
	const auto &newViewProps = *std::static_pointer_cast<XRNImageViewProps const>(props);
	
	if (oldViewProps.tintColor != newViewProps.tintColor) {
		UIColor *color = RCTUIColorFromSharedColor(newViewProps.tintColor);
		[_imageView setImageTintColor:color];
	}
	
	if (oldViewProps.source != newViewProps.source) {
		NSArray<ExpoImageSource *> *sources = [self convertSources:newViewProps.source];
		[_imageView setSources:sources];
	}
	
	if (oldViewProps.placeholder != newViewProps.placeholder) {
		NSArray<ExpoImageSource *> *sources = [self convertPlaceholders:newViewProps.placeholder];
		[_imageView setPlaceholderSources:sources];
	}
	
	if (oldViewProps.contentFit != newViewProps.contentFit) {
		ExpoImageContentFit fit = ExpoImageContentFitCover;
		switch (newViewProps.contentFit) {
			case XRNImageViewContentFit::Cover:
				fit = ExpoImageContentFitCover;
				break;
			case XRNImageViewContentFit::Contain:
				fit = ExpoImageContentFitContain;
				break;
			case XRNImageViewContentFit::Fill:
				fit = ExpoImageContentFitFill;
				break;
			case XRNImageViewContentFit::None:
				fit = ExpoImageContentFitNone;
				break;
			case XRNImageViewContentFit::ScaleDown:
				fit = ExpoImageContentFitScaleDown;
				break;
			default:
				fit = ExpoImageContentFitCover;
				break;
		}
		[_imageView setContentFit:fit];
	}
	
	if (oldViewProps.placeholderContentFit != newViewProps.placeholderContentFit) {
		ExpoImageContentFit fit = ExpoImageContentFitCover;
		switch (newViewProps.placeholderContentFit) {
			case XRNImageViewPlaceholderContentFit::Cover:
				fit = ExpoImageContentFitCover;
				break;
			case XRNImageViewPlaceholderContentFit::Contain:
				fit = ExpoImageContentFitContain;
				break;
			case XRNImageViewPlaceholderContentFit::Fill:
				fit = ExpoImageContentFitFill;
				break;
			case XRNImageViewPlaceholderContentFit::None:
				fit = ExpoImageContentFitNone;
				break;
			case XRNImageViewPlaceholderContentFit::ScaleDown:
				fit = ExpoImageContentFitScaleDown;
				break;
			default:
				fit = ExpoImageContentFitCover;
				break;
		}
		[_imageView setPlaceholderContentFit:fit];
	}
	
	if (oldViewProps.contentPosition != newViewProps.contentPosition) {
		const auto &pos = newViewProps.contentPosition;
		ExpoImageContentPosition *ocPos = [ExpoImageContentPosition center];
		
		//		static NSNumberFormatter *fmt;
		//		static dispatch_once_t onceToken;
		//		dispatch_once(&onceToken, ^{
		//			fmt = [NSNumberFormatter new];
		//			fmt.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
		//		});
		
		auto makeValue = ^ExpoImageContentPositionValue *(const std::string &s) {
			if (s.empty()) {
				return (ExpoImageContentPositionValue *)nil;
			}
			
			const char *c = s.c_str();
			char *end = nullptr;
			double v = strtod(c, &end);
			id val = (end && *end == '\0') ? @(v) : [NSString stringWithUTF8String:c];
			
			//			NSString *str = [NSString stringWithUTF8String:s.c_str()];
			//			NSNumber *num = [fmt numberFromString:str];
			//			id val = num ? num : str;
			return [[ExpoImageContentPositionValue alloc] initWithValue:val];
		};
		
		ocPos.top = makeValue(pos.top);
		ocPos.bottom = makeValue(pos.bottom);
		ocPos.left = makeValue(pos.left);
		ocPos.right = makeValue(pos.right);
		[_imageView setContentPosition:ocPos];
	}
	
	if (oldViewProps.transition != newViewProps.transition) {
		ExpoImageTransition *t = [ExpoImageTransition new];
		t.duration = newViewProps.transition.duration;
		[_imageView setTransition:t];
	}
	
	if (oldViewProps.blurRadius != newViewProps.blurRadius) {
		[_imageView setBlurRadius:newViewProps.blurRadius];
	}
	
	if (oldViewProps.priority != newViewProps.priority) {
		ExpoImagePriority priority = ExpoImagePriorityNormal;
		switch (newViewProps.priority) {
			case XRNImageViewPriority::Low:
				priority = ExpoImagePriorityLow;
				break;
			case XRNImageViewPriority::High:
				priority = ExpoImagePriorityHigh;
				break;
			case XRNImageViewPriority::Normal:
				priority = ExpoImagePriorityNormal;
				break;
			default:
				priority = ExpoImagePriorityNormal;
				break;
		}
		[_imageView setPriority:priority];
	}
	
	if (oldViewProps.cachePolicy != newViewProps.cachePolicy) {
		ExpoImageCachePolicy policy = ExpoImageCachePolicyDisk;
		switch (newViewProps.cachePolicy) {
			case XRNImageViewCachePolicy::None:
				policy = ExpoImageCachePolicyNone;
				break;
			case XRNImageViewCachePolicy::Disk:
				policy = ExpoImageCachePolicyDisk;
				break;
			case XRNImageViewCachePolicy::Memory:
				policy = ExpoImageCachePolicyMemory;
				break;
			case XRNImageViewCachePolicy::MemoryDisk:
				policy = ExpoImageCachePolicyMemoryAndDisk;
				break;
			default:
				policy = ExpoImageCachePolicyDisk;
				break;
		}
		[_imageView setCachePolicy:policy];
	}
	
//	if (oldViewProps.enableLiveTextInteraction != newViewProps.enableLiveTextInteraction) {
//		[_imageView setEnableLiveTextInteraction:newViewProps.enableLiveTextInteraction];
//	}
	
	if (oldViewProps.accessible != newViewProps.accessible) {
		[_imageView setAccessible:newViewProps.accessible];
	}
	
	if (oldViewProps.accessibilityLabel != newViewProps.accessibilityLabel) {
		NSString *accessibilityLabelStr = newViewProps.accessibilityLabel.empty() ? nil : [NSString stringWithUTF8String:newViewProps.accessibilityLabel.c_str()];
		if (accessibilityLabelStr) {
			[_imageView setXtAccessibilityLabel:accessibilityLabelStr];
		}
	}
	
	if (oldViewProps.recyclingKey != newViewProps.recyclingKey) {
		NSString *key = newViewProps.recyclingKey.empty() ? nil : [NSString stringWithUTF8String:newViewProps.recyclingKey.c_str()];
		[_imageView setRecyclingKey:key];
	}
	
	if (oldViewProps.allowDownscaling != newViewProps.allowDownscaling) {
		[_imageView setAllowDownscaling:newViewProps.allowDownscaling];
	}
	
	if (oldViewProps.autoplay != newViewProps.autoplay) {
		[_imageView setAutoplay:newViewProps.autoplay];
	}
	
	if (oldViewProps.decodeFormat != newViewProps.decodeFormat) {
		
	}
	
	if (oldViewProps.focusable != newViewProps.focusable) {
		
	}
	
	[super updateProps:props oldProps:oldProps];
}

- (void)updateEventEmitter:(facebook::react::EventEmitter::Shared const &)eventEmitter
{
	[super updateEventEmitter:eventEmitter];
	
	auto emitter = std::static_pointer_cast<const XRNImageViewEventEmitter>(eventEmitter);
	
	if (!_imageView) {
		return;
	}
	
	if (emitter) {
		std::weak_ptr<const XRNImageViewEventEmitter> weakEmitter = emitter;
		
		_imageView.onLoadStart = ^(NSDictionary *payload) {
			auto lockedEmitter = weakEmitter.lock();
			if (!lockedEmitter) return;
			
			lockedEmitter->onLoadStart({});
		};
		
		_imageView.onDisplay = ^(NSDictionary *body) {
			auto lockedEmitter = weakEmitter.lock();
			if (!lockedEmitter) return;
			
			lockedEmitter->onDisplay({});
		};
		
		_imageView.onError = ^(NSDictionary *body) {
			auto lockedEmitter = weakEmitter.lock();
			if (!lockedEmitter) return;
			
			NSString *msg = body[@"error"];
			if (![msg isKindOfClass:[NSString class]]) msg = nil;
			std::string errorStr = msg ? [msg UTF8String] : "";
			lockedEmitter->onError({errorStr});
		};
		
		_imageView.onLoad = ^(NSDictionary *body) {
			auto lockedEmitter = weakEmitter.lock();
			if (!lockedEmitter) return;
			
			NSString *cache = body[@"cacheType"];
			if (![cache isKindOfClass:[NSString class]]) cache = nil;
			
			NSDictionary *source = body[@"source"];
			if (![source isKindOfClass:[NSDictionary class]]) source = nil;
			
			double w = [source[@"width"] doubleValue];
			double h = [source[@"height"] doubleValue];
			
			NSString *url = source[@"url"];
			if (![url isKindOfClass:[NSString class]]) url = nil;
			
			NSString *mediaType = source[@"mediaType"];
			if (![mediaType isKindOfClass:[NSString class]]) mediaType = nil;
			
			auto cacheType = XRNImageViewEventEmitter::OnLoadCacheType::None;
			if ([cache isEqualToString:@"disk"]) {
				cacheType = XRNImageViewEventEmitter::OnLoadCacheType::Disk;
			} else if ([cache isEqualToString:@"memory"]) {
				cacheType = XRNImageViewEventEmitter::OnLoadCacheType::Memory;
			}
			
			lockedEmitter->onLoad({
				.cacheType = cacheType,
				.source = {
					.url = url ? std::string([url UTF8String]) : "",
					.width = static_cast<Float>(w),
					.height = static_cast<Float>(h),
					.mediaType = mediaType ? std::string([mediaType UTF8String]) : "",
				}
			});
		};
		
		_imageView.onProgress = ^(NSDictionary *body) {
			auto lockedEmitter = weakEmitter.lock();
			if (!lockedEmitter) return;
			
			NSNumber *loaded = body[@"loaded"];
			NSNumber *total  = body[@"total"];
			
			lockedEmitter->onProgress({
				loaded ? loaded.intValue : 0,
				total ? total.intValue  : 0,
			});
		};
		
	} else {
		_imageView.onLoadStart = nil;
		_imageView.onProgress = nil;
		_imageView.onError = nil;
		_imageView.onLoad = nil;
		_imageView.onDisplay = nil;
	}
}

- (NSArray<ExpoImageSource *> *)convertSources:(const std::vector<XRNImageViewSourceStruct> &)cppSources {
	NSMutableArray<ExpoImageSource *> *sources = [NSMutableArray arrayWithCapacity:cppSources.size()];
	
	for (const auto &cppSource : cppSources) {
		ExpoImageSource *source = [self convertSource:cppSource];
		if (source) {
			[sources addObject:source];
		}
	}
	
	return [sources copy];
}

- (ExpoImageSource *)convertSource:(const XRNImageViewSourceStruct &)cppSource {
	ExpoImageSource *source = [[ExpoImageSource alloc] init];
	
	if (!cppSource.uri.empty()) {
		NSString *uriString = [NSString stringWithUTF8String:cppSource.uri.c_str()];
		source.uri = [NSURL URLWithString:uriString];
	}
	
	if (!cppSource.cacheKey.empty()) {
		source.cacheKey = [NSString stringWithUTF8String:cppSource.cacheKey.c_str()];
	}
	
	source.width = cppSource.width;
	source.height = cppSource.height;
	
//	source.scale = cppSource.scale > 0 ? cppSource.scale : 1.0;
	
//	if (!cppSource.headers.empty()) {
//		NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:cppSource.headers.size()];
//		for (const auto &h : cppSource.headers) {
//			if (!h.name.empty() && !h.value.empty()) {
//				dict[@(h.name.c_str())] = @(h.value.c_str());
//			}
//		}
//		source.headers = [dict copy];
//	}
	
	return source;
}

- (NSArray<ExpoImageSource *> *)convertPlaceholders:(const std::vector<XRNImageViewPlaceholderStruct> &)cppSources {
	NSMutableArray<ExpoImageSource *> *sources = [NSMutableArray arrayWithCapacity:cppSources.size()];
	
	for (const auto &cppSource : cppSources) {
		ExpoImageSource *source = [self convertPlaceholder:cppSource];
		if (source) {
			[sources addObject:source];
		}
	}
	
	return [sources copy];
}

- (ExpoImageSource *)convertPlaceholder:(const XRNImageViewPlaceholderStruct &)cppSource {
	ExpoImageSource *source = [[ExpoImageSource alloc] init];
	
	if (!cppSource.uri.empty()) {
		NSString *uriString = [NSString stringWithUTF8String:cppSource.uri.c_str()];
		source.uri = [NSURL URLWithString:uriString];
	}
	
	if (!cppSource.cacheKey.empty()) {
		source.cacheKey = [NSString stringWithUTF8String:cppSource.cacheKey.c_str()];
	}
	
	source.width = cppSource.width;
	source.height = cppSource.height;
	
//	source.scale = cppSource.scale > 0 ? cppSource.scale : 1.0;
	
//	if (!cppSource.headers.empty()) {
//		NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:cppSource.headers.size()];
//		for (const auto &h : cppSource.headers) {
//			if (!h.name.empty() && !h.value.empty()) {
//				dict[@(h.name.c_str())] = @(h.value.c_str());
//			}
//		}
//		source.headers = [dict copy];
//	}
	
	return source;
}

Class<RCTComponentViewProtocol> XrnExpoImageViewCls(void)
{
	return XrnExpoImageView.class;
}

@end