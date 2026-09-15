//
//  NavigationAction.m
//  xtapp
//
//  Created by  xtgq on 2025/5/6.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "NavigationAction.h"
#import "XTNativeRouterManager.h"
#import "XRNNavigation.h"
#import "BundleNavigation.h"
#import "JSONUtils.h"
#import "XTBaseBundleViewController.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>

@implementation NavigationAction

+ (instancetype)shared {
    static NavigationAction *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[NavigationAction alloc] init];
    });
    return instance;
}

- (void)dispatchAction:(NSString *)action {
    NSDictionary *actionObj = [JSONUtils jsonStringToDictionary:action];
    if (![actionObj isKindOfClass:[NSDictionary class]] || actionObj.count <= 0 ) {
        NSLog(@"[Error] Invalid action format");
        return;
    }
    
    NSDictionary *payload = actionObj[@"payload"];
    if (![payload isKindOfClass:[NSDictionary class]]) {
        payload = @{};
    }
    
    NSString *type = actionObj[@"type"];
    if (![type isKindOfClass:[NSString class]]) {
        type = @"";
    }
    
    if ([type isEqualToString:@"NAVIGATE"]) {
        [self navigateAction:action payload:payload];
    } else if ([type isEqualToString:@"PUSH"]) {
        [self pushAction:payload];
    } else if ([type isEqualToString:@"REPLACE"]) {
        [self replaceAction:payload];
    } else if ([type isEqualToString:@"GO_BACK"]) {
        [self goBackAction];
    } else {
        NSLog(@"[Warning] Unknown action type: %@", type);
    }
}

- (void)setNavigationKey:(NSString *)key {
    UINavigationController *nvc = [XTNativeRouterManager shared].nav;
    UIViewController *stackTopVC = nvc.viewControllers.lastObject;
    if (!stackTopVC) {
        return;
    }
    
    if ([stackTopVC isKindOfClass:[XTBaseBundleViewController class]]) {
        XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)stackTopVC;
        mainVc.rootStackKey = key;
    }
}

- (void)setNavigationState:(NSString *)state {
    UINavigationController *nvc = [XTNativeRouterManager shared].nav;
    UIViewController *stackTopVC = nvc.viewControllers.lastObject;
    if (!stackTopVC) {
        return;
    }
    
    if ([stackTopVC isKindOfClass:[XTBaseBundleViewController class]]) {
        XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)stackTopVC;
        mainVc.navigationState = state;
    }
}

#pragma mark - Private

- (void)navigateAction:(NSString *)action payload:(NSDictionary *)payload {
    [self navigateViewController:action payload:payload];
}

- (void)pushAction:(NSDictionary *)payload {
    [self pushViewController:payload replace:NO];
}

- (void)replaceAction:(NSDictionary *)payload {
    [self pushViewController:payload replace:YES];
}

- (void)goBackAction {
    [[XTNativeRouterManager shared] popViewControllerAnimated:YES];
}

- (void)navigateViewController:(NSString *)action payload:(NSDictionary *)payload {
    NSInteger targetIndex = [self findTargetBundleViewController:payload];
    
    // 原生导航栈中存在此路由,就移除index之后的路由
    if (targetIndex >= 0) {
        // A -> B -> C -> D  => navigate(B)，导航栈结构：[A, B]
        NSArray *newStacks = [self replaceViewControllerAtIndex:targetIndex];
        if (!newStacks || targetIndex >= newStacks.count) {
            return;
        }
        
        // 获取最新导航栈栈顶的控制器
        UIViewController *targetVc = newStacks[targetIndex];
        NSString *rootKey = nil;
        XTJSRuntimeContext *runtimeContext = nil;
        
        if ([targetVc isKindOfClass:[XTBaseBundleViewController class]]) {
            XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)targetVc;
            rootKey = mainVc.rootStackKey;
            runtimeContext = mainVc.runtimeContext;
        }
        
        if (runtimeContext && rootKey) {
            [self bundleCallbackEmit:action payload:payload context:runtimeContext rootKey:rootKey];
        }
    } else {
        [self pushViewController:payload replace:NO];
    }
}

- (NSArray *)replaceViewControllerAtIndex:(NSInteger)index {
    UINavigationController *nvc = [XTNativeRouterManager shared].nav;
    if (!nvc || index >= nvc.viewControllers.count) {
        return nil;
    }
    
    NSRange range = NSMakeRange(0, index + 1);
    NSArray *subArr = [nvc.viewControllers subarrayWithRange:range];
    [nvc setViewControllers:subArr animated:NO];
    return subArr;
}

- (void)bundleCallbackEmit:(NSString *)action
                   payload:(NSDictionary *)payload
                   context:(XTJSRuntimeContext *)context
                   rootKey:(NSString *)rootKey {
    NSString *path = payload[@"name"];
    if (![path isKindOfClass:[NSString class]]) return;
    
    NSDictionary *pathObj = [self parseNavigatePath:path];
    NSString *pageName = pathObj[@"pageName"];
    if (!pageName || pageName.length <= 0) return;
    
	XRNNavigation *navigationModule = (XRNNavigation *)[context moduleForClass:[XRNNavigation class]];
    if (![navigationModule isKindOfClass:[XRNNavigation class]]) {
        return;
    }
    NSMutableDictionary *actionDic = [[JSONUtils jsonStringToDictionary:action] mutableCopy];
    actionDic[@"target"] = rootKey;
    
    NSMutableDictionary *tempPayload = [actionDic[@"payload"] mutableCopy];
    if (tempPayload) {
        tempPayload[@"name"] = pageName;
    }
    actionDic[@"payload"] = tempPayload;
    
	NSString *actionStr = [JSONUtils dictionaryToJsonString:actionDic];
    [navigationModule sendCustomEvent:@"NATIVE_DISPATCH_ACTION" data:actionStr];
}

- (void)pushViewController:(NSDictionary *)payload replace:(BOOL)replace {
    NSString *path = payload[@"name"];
    if (![path isKindOfClass:[NSString class]]) return;
    
    NSDictionary *pathObj = [self parseNavigatePath:path];
    NSString *bundleName = pathObj[@"bundleName"];
    NSString *moduleName = pathObj[@"moduleName"];
    NSString *pageName = pathObj[@"pageName"];
    if (bundleName.length <= 0 || moduleName.length <= 0) return;
    
    NSMutableDictionary *messageDic = [NSMutableDictionary dictionary];
    NSDictionary *params = payload[@"params"];
    if ([pageName isKindOfClass:[NSString class]] && pageName.length > 0) {
        messageDic[@"initialRouteName"] = pageName;
    }
    if ([params isKindOfClass:[NSDictionary class]] && params.count > 0) {
        messageDic[@"initialRouteParams"] = params;
    }
    NSString *message = [JSONUtils dictionaryToJsonString:messageDic] ?: @"";
    
    BundleNavigation *bundleNav = [[BundleNavigation alloc] init];
    if (![message isKindOfClass:[NSString class]] || message.length <= 0) {
        return;
    }
    
    [bundleNav native_navPushBundleProject:bundleName moduleName:moduleName message:message replace:replace];
}

// 解析路由path：“/bundleName/moduleName/pageName”
- (NSDictionary *)parseNavigatePath:(NSString *)path {
    NSString *trimmedPath = [path stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    trimmedPath = [trimmedPath stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"/"]];
    NSArray *components = [trimmedPath componentsSeparatedByString:@"/"];
    
    NSMutableArray *cleanComponents = [NSMutableArray array];
    for (NSString *c in components) {
        NSString *trimmed = [c stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        if (trimmed.length > 0) {
            [cleanComponents addObject:trimmed];
        }
    }
    
    NSString *bundleName = cleanComponents.count > 0 ? cleanComponents[0] : @"";
    NSString *moduleName = cleanComponents.count > 1 ? cleanComponents[1] : @"";
    NSString *pageName = cleanComponents.count > 2 ? cleanComponents[2] : @"";
    return @{@"bundleName": bundleName,
             @"moduleName": moduleName,
             @"pageName": pageName
    };
}

- (NSInteger)findTargetBundleViewController:(NSDictionary *)payload {
    NSString *path = payload[@"name"];
    if (![path isKindOfClass:[NSString class]]) {
        return -1;
    }
    
    NSDictionary *pathObj = [self parseNavigatePath:path];
    NSString *bundleName = pathObj[@"bundleName"];
    NSString *moduleName = pathObj[@"moduleName"];
    NSString *pageName = pathObj[@"pageName"];
    if (bundleName.length <= 0 || moduleName.length <= 0) {
        return -1;
    }
    
    NSArray *viewControllers = [XTNativeRouterManager shared].nav.viewControllers;
    for (NSInteger i = 0; i < viewControllers.count; i++) {
        UIViewController *vc = viewControllers[i];
        NSString *vcBundleName = nil;
        NSString *vcModuleName = nil;
        NSString *vcNavigationState = nil;
        
        if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
            XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)vc;
            vcBundleName = mainVc.runtimeContext.jsBundleName;
            vcModuleName = mainVc.moduleName;
            vcNavigationState = mainVc.navigationState;
        }
        
        if ([vcBundleName isEqualToString:bundleName] &&
            [vcModuleName isEqualToString:moduleName] &&
            [self hasSamePageWithNavigationState:vcNavigationState pageName:pageName]) {
            return i;
        }
    }

    return -1;
}

/**
 通过控制器缓存的 RN 导航状态（navigationState）判断其导航树中是否包含目标页面。

 - 目标未指定具体页面（pageName 为空）或状态尚未保存时，仅按 bundleName + moduleName 匹配。
 - 状态格式异常无法解析时返回 NO，避免误命中。
 */
- (BOOL)hasSamePageWithNavigationState:(NSString *)navigationState pageName:(NSString *)pageName {
    if (pageName.length <= 0 || navigationState.length <= 0) {
        return NO;
    }
    
    NSDictionary *stateDic = [JSONUtils jsonStringToDictionary:navigationState];
    return [self navigationStateDictionary:stateDic containsPage:pageName];
}

/**
 递归遍历导航状态树（含嵌套导航器的 route.state），判断是否存在 name 与目标页面一致的路由。
 */
- (BOOL)navigationStateDictionary:(NSDictionary *)stateDic containsPage:(NSString *)pageName {
    if (![stateDic isKindOfClass:[NSDictionary class]]) {
        return NO;
    }
    
    NSArray *routes = stateDic[@"routes"];
    if (![routes isKindOfClass:[NSArray class]]) {
        return NO;
    }
    
    for (id route in routes) {
        if (![route isKindOfClass:[NSDictionary class]]) {
            continue;
        }
        
        NSString *name = route[@"name"];
        if ([name isKindOfClass:[NSString class]] && [name isEqualToString:pageName]) {
            return YES;
        }
        
        NSDictionary *childState = route[@"state"];
        if ([self navigationStateDictionary:childState containsPage:pageName]) {
            return YES;
        }
    }
    
    return NO;
}

@end
