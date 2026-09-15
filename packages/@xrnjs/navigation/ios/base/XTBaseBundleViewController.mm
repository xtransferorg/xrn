//
//  XTBaseBundleViewController.m
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTBaseBundleViewController.h"
#import "XRNNavigation.h"
#import "XTNativeRouterManager.h"
#import "JSONUtils.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <ReactCommon/RCTHost.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceDelegate.h>
#import <React/RCTSurfaceStage.h>

@interface RCTHost (XTSurfaceAttach)
- (void)_attachSurface:(RCTFabricSurface *)surface;
@end

@implementation XTPageSideSwipeInfo

@end

@interface XTBaseBundleViewController ()<UIGestureRecognizerDelegate>

@property (nonatomic, strong) XTJSRuntimeContext *runtimeContext;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSDictionary *initialProperties;

@property (nonatomic, strong, readwrite, nullable) RCTFabricSurface *fabricSurface;
@property (nonatomic, assign) NSUInteger surfaceReadyGeneration;

@end

@implementation XTBaseBundleViewController

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (instancetype)initWithRuntimeContext:(XTJSRuntimeContext *)runtimeContext
                            moduleName:(NSString *)moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties {
    self = [super initWithNibName:nil bundle:nil];
    if (self) {
        self.runtimeContext = runtimeContext;
        self.moduleName = moduleName;
        self.initialProperties = initialProperties;
        self.rootStackKey = @"";
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.view.backgroundColor = UIColor.whiteColor;
}

- (void)setRootStackKey:(NSString *)rootStackKey {
    _rootStackKey = rootStackKey;
}

- (void)setNavigationState:(NSString *)navigationState {
    _navigationState = navigationState;
}

- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear: animated];
    [self postEmitWithEventName:@"XT_SCREEN_APPEAR"];
}

- (void)viewDidDisappear:(BOOL)animated {
    [super viewDidDisappear:animated];
    [self postEmitWithEventName:@"XT_SCREEN_DISAPPEAR"];
}

- (void)postEmitWithEventName:(NSString *)eventName {
    XTJSRuntimeContext *context = self.runtimeContext;
    XRNNavigation *module = (XRNNavigation *)[context moduleForClass:XRNNavigation.class];
    NSString *curBundleName = context.jsBundleName ?: @"";
    NSDictionary *params = @{@"bundleName":curBundleName, @"moduleName":self.moduleName ?: @"", @"rootKey":self.rootStackKey ?: @""};
    [module sendCustomEvent:eventName data:params];
}

- (void)removeAniamtionVCAndPlaceHolderImage {
    
}


#pragma mark - Host Fabric Surface（拆包：biz 就绪后再 start）

- (void)bindFabricSurface:(RCTFabricSurface *)surface host:(RCTHost *)host {
	self.fabricSurface = surface;
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	// 同一 VC 可能多次 attach（Surface 重建）；先摘掉本 VC 上该通知，避免重复回调。
	[nc removeObserver:self name:XTHostDidReloadNotification object:nil];
	[nc addObserver:self selector:@selector(onHostDidReload:) name:XTHostDidReloadNotification object:host];
}

- (void)attachFabricSurface:(RCTFabricSurface *)surface toHost:(RCTHost *)host {
	[host _attachSurface:surface];
	[self bindFabricSurface:surface host:host];
}

- (void)prepareHostingViewForRestart {
	if (!self.fabricSurface) {
		return;
	}
	id<RCTSurfaceDelegate> del = self.fabricSurface.delegate;
	if ([del respondsToSelector:@selector(surface:didChangeStage:)]) {
		[del surface:(RCTSurface *)(id)self.fabricSurface didChangeStage:RCTSurfaceStagePreparing];
	}
}

- (void)startSurfaceWhenBizReady {
	if (!self.fabricSurface) {
		return;
	}
	self.surfaceReadyGeneration += 1;
	NSUInteger generation = self.surfaceReadyGeneration;

	XTJSRuntimeContext *context = self.runtimeContext;
	if (!context) {
		return;
	}

	__weak __typeof(self) weakSelf = self;
	[context whenSurfaceReady:^{
		__strong __typeof(weakSelf) strongSelf = weakSelf;
		if (!strongSelf || !strongSelf.fabricSurface) {
			return;
		}
		if (generation != strongSelf.surfaceReadyGeneration) {
			return;
		}
		[strongSelf prepareHostingViewForRestart];
		[strongSelf.fabricSurface start];
	}];
}

- (void)onHostDidReload:(NSNotification *)note {
	dispatch_async(dispatch_get_main_queue(), ^{
		[self prepareHostingViewForRestart];
		[self startSurfaceWhenBizReady];
	});
}

#pragma mark - 手势拦截点
- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer {
    // 只拦截系统侧滑返回
    if (gestureRecognizer == self.navigationController.interactivePopGestureRecognizer) {
        if ([xtNavController().viewControllers.lastObject isEqual:self] &&
            self.pageSideSwipeInfos.count > 0 &&
            self.pageSideSwipeInfos.lastObject.interceptSideSwipe) {
            [self sendPopRequestToJS]; 
            return NO; // 暂时阻止 pop，等待 JS 响应
        }
    }
    if (self.pageSideSwipeInfos.count > 0) {
        [self.pageSideSwipeInfos removeLastObject];
    }
    return YES;
}

// 发送事件通知js侧处理返回事件
- (void)sendPopRequestToJS {
    if (self.pageSideSwipeInfos.count == 0) {
        return;
    }
    RCTHost *host = (RCTHost *)self.runtimeContext.host;
    NSDictionary *args = @{@"routeKey": self.pageSideSwipeInfos.lastObject.routeKey ?: @""};
    [host callFunctionOnJSModule:@"RCTDeviceEventEmitter"
                          method:@"emit"
                            args:@[@"XT_IOS_PAGESIDESWIPEBACK", args]];
}

- (void)addPageSideSwipeInfos:(BOOL)shouldIntercept routeKey:(NSString *)routeKey {
    if (!routeKey || routeKey.length == 0) {
        return;
    }
     
    if (!self.pageSideSwipeInfos) {
        self.pageSideSwipeInfos = [NSMutableArray array];
    }
     
    XTPageSideSwipeInfo *lastInfo = self.pageSideSwipeInfos.lastObject;
    if (lastInfo && [lastInfo.routeKey isEqual:routeKey]) {
        // 处理当前routeKey存在的情况
        lastInfo.interceptSideSwipe = shouldIntercept;
    } else {
        XTPageSideSwipeInfo *newInfo = [XTPageSideSwipeInfo new];
        newInfo.interceptSideSwipe = shouldIntercept;
        newInfo.routeKey = routeKey;
        [self.pageSideSwipeInfos addObject:newInfo];
    }
    [self updataInteractivePopGestureRecognizer];
}

- (void)removePageSideSwipeInfos {
    if (self.pageSideSwipeInfos && self.pageSideSwipeInfos.count > 0) {
        [self.pageSideSwipeInfos removeLastObject];
        [self updataInteractivePopGestureRecognizer];
    }
}

// 根据当前页面interceptSideSwipe 设置侧滑手势代理
- (void)updataInteractivePopGestureRecognizer {
    if (self.pageSideSwipeInfos &&
        self.pageSideSwipeInfos.count > 0 &&
        self.pageSideSwipeInfos.lastObject.interceptSideSwipe) {
        self.navigationController.interactivePopGestureRecognizer.delegate = self;
    } else {
        self.navigationController.interactivePopGestureRecognizer.delegate = nil;
    }
}

@end
