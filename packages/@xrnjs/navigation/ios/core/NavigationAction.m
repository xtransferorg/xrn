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
#import <react-native-xrn-multi-bundle/RCTBridge+XTExtension.h>

@implementation NavigationAction

+ (instancetype)shared {
    static NavigationAction *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[NavigationAction alloc] init];
    });
    return instance;
}

/**
 Dispatch a navigation action described by a JSON string.

 - Parameter action: A JSON string with the shape:
   {
     "type": "NAVIGATE" | "PUSH" | "REPLACE" | "GO_BACK",
     "payload": { "name": "/bundleName/moduleName/pageName", "params"?: { ... } }
   }

 Behavior:
 1. Parses and validates the JSON string.
 2. Routes the request based on `type` by calling `navigateAction:payload:`, `pushAction:`, `replaceAction:`, or `goBackAction`.
 3. Logs a warning for unknown action types.
 */
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

/**
 Set the root stack key for the current top bundle view controller on the native navigation stack.

 - Parameter key: A string identifier used by the JS navigation stack to correlate native-dispatched actions.

 Behavior:
 1. Finds the top `UIViewController` in the current `UINavigationController`.
 2. If it is an `XTBaseBundleViewController`, assigns `rootStackKey` to the provided key.
 */
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

/**
 Set the serialized navigation state for the current top bundle view controller.

 - Parameter state: A string (typically JSON) representing the navigation state to be consumed by the JS side.

 Behavior:
 1. Finds the top `UIViewController` in the current `UINavigationController`.
 2. If it is an `XTBaseBundleViewController`, assigns `navigationState` to the provided value.
 */
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

/**
 Navigate to a target bundle view controller if it exists in the native stack; otherwise push a new one.

 - Parameters:
   - action: Original action JSON string (used when emitting a callback if the target exists).
   - payload: Dictionary expected to include `name` as a route path and optional `params`.

 Behavior:
 1. Searches the native navigation stack for a view controller matching the bundle/module in `payload.name`.
 2. If found, trims the stack to that controller and emits a callback to the JS bundle to handle the page-level navigation.
 3. If not found, pushes a new view controller for the specified bundle/module.
 */
- (void)navigateViewController:(NSString *)action payload:(NSDictionary *)payload {
    NSInteger targetIndex = [self findTargetBundleViewController:payload];
    
    // If the route exists in the native navigation stack, trim entries after the target index
    if (targetIndex >= 0) {
        // Example: A -> B -> C -> D  => navigate(B) results in stack: [A, B]
        NSArray *newStacks = [self replaceViewControllerAtIndex:targetIndex];
        if (!newStacks || targetIndex >= newStacks.count) {
            return;
        }
        
        // Get the latest top controller from the updated navigation stack
        UIViewController *targetVc = newStacks[targetIndex];
        NSString *rootKey = nil;
        RCTBridge *bridge = nil;
        
        if ([targetVc isKindOfClass:[XTBaseBundleViewController class]]) {
            XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)targetVc;
            bridge = mainVc.bridge;
            rootKey = mainVc.rootStackKey;
        }
        
        if (bridge && rootKey) {
            [self bundleCallbackEmit:action payload:payload bridge:bridge rootKey:rootKey];
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

/**
 Emit a navigation action back to a specific JS bundle/root stack.

 - Parameters:
   - action: Original action JSON string dispatched from JS.
   - payload: Parsed payload dictionary from the action, expected to include `name` as a path.
   - bridge: The `RCTBridge` associated with the target bundle.
   - rootKey: The root stack key to target within the bundle's navigation tree.

 Behavior:
 1. Parses `payload.name` to extract `pageName`.
 2. Clones and augments the original action by setting `target` to `rootKey` and overriding `payload.name` with `pageName`.
 3. Sends the updated action to the JS side via the `XRNNavigation` module with event `NATIVE_DISPATCH_ACTION`.
 */
- (void)bundleCallbackEmit:(NSString *)action
                   payload:(NSDictionary *)payload
                    bridge:(RCTBridge *)bridge
                   rootKey:(NSString *)rootKey {
    NSString *path = payload[@"name"];
    if (![path isKindOfClass:[NSString class]]) return;
    
    NSDictionary *pathObj = [self parseNavigatePath:path];
    NSString *pageName = pathObj[@"pageName"];
    if (!pageName || pageName.length <= 0) return;
    
	XRNNavigation *navigationModule = (XRNNavigation *)[bridge moduleForClass:[XRNNavigation class]];
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

/**
 Push or replace a bundle view controller onto the native navigation stack.

 - Parameters:
   - payload: Dictionary containing at least `name` (path: `/bundleName/moduleName/pageName`) and optional `params`.
   - replace: If YES, replaces the top view controller; if NO, pushes a new one.

 Behavior:
 1. Parses `payload.name` into bundle/module/page.
 2. Builds a message containing `initialRouteName` and optional `initialRouteParams`.
 3. Invokes native navigation to present the specified bundle/module, honoring the `replace` flag.
 */
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

// Parse route path: "/bundleName/moduleName/pageName"
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
    if (bundleName.length <= 0 || moduleName.length <= 0) {
        return -1;
    }
    
    NSArray *viewControllers = [XTNativeRouterManager shared].nav.viewControllers;
    for (NSInteger i = 0; i < viewControllers.count; i++) {
        UIViewController *vc = viewControllers[i];
        NSString *vcBundleName = nil;
        NSString *vcModuleName = nil;
        
        if ([vc isKindOfClass:[XTBaseBundleViewController class]]) {
            XTBaseBundleViewController *mainVc = (XTBaseBundleViewController *)vc;
            vcBundleName = mainVc.bridge.xt_jsBundleName;
            vcModuleName = mainVc.moduleName;
        }
        
        if ([vcBundleName isEqualToString:bundleName] && [vcModuleName isEqualToString:moduleName]) {
            return i;
        }
    }

    return -1;
}

@end
