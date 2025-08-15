#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevSettings.h>

#import "xrngo-Swift.h"
#import "XTMultiBundleManager.h"
#import "XTPluginManage.h"
#import <CodePush/CodePush.h>
#import "XTBundleViewController.h"
#import "XTJSBundleTool.h"
#import "XTMainBundleViewController.h"
#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import "XTBundleProvider.h"
#import "XTBundleViewControllerFactory.h"

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/config/ReactNativeConfig.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
    RCTTurboModuleManager *_turboModuleManager;
    RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
    std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
    facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#endif

@interface AppDelegate ()<XTMultiBundleDataSource>

@property (nonatomic, copy) NSDictionary *launchOption;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    //  RCTAppSetupPrepareApp(application);
    
    self.launchOpptions = launchOptions;
    
    [XTMultiBundleManager shared].dataSource = self;
    [[XTMultiBundleManager shared] startUp];
    
    [self loadMainVC];
    
    [[XTPluginManage shareInstance] addSuspendBallToWindow];
    return YES;
}

-(void)loadMainVC {
    
    RCTBridge *mainBridge = [XTMultiBundleManager.shared.pool fetchJSBridgeWithJSBundleName:[[XTJSBundleTool shared] getMainBundleName]];
    RCTDevSettings *decSetting = [mainBridge moduleForClass:[RCTDevSettings class]];
    decSetting.isShakeToShowDevMenuEnabled = NO;
    
    NSString *mainModuleName = [XTMultiBundleManager.shared.pool fetchDefaultModuleNameWithJSBundleName:[[XTJSBundleTool shared] getMainBundleName]];
    
#if RCT_NEW_ARCH_ENABLED
    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
    _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
    bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif
    
    XTBundleViewControllerFactory *bundleVCfactory = [[XTBundleViewControllerFactory alloc] init];
    [XTNativeRouterManager shared].bundleVCFactory = bundleVCfactory;
    XTMainBundleViewController *rootViewController = [[XTMainBundleViewController alloc] initWithBridge:mainBridge moduleName:mainModuleName initialProperties:self.launchOption];
    rootViewController.view.backgroundColor = [UIColor whiteColor];
    
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    XTNavigationViewController *nav = [[XTNavigationViewController alloc] initWithRootViewController:rootViewController];
    self.window.rootViewController = nav;
    [self.window makeKeyAndVisible];
}

- (NSArray <XTBundleData *>*_Nonnull)multiBundleForBundleModelArray {
    
    NSMutableArray <XTBundleData *>*bundleDataArray = [NSMutableArray arrayWithCapacity:10];
    
    NSString *mainDeploymentKey = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CodePushDeploymentKey"];
    NSString *mainBundleName = [XTJSBundleTool.shared getMainBundleName];
    NSString *mainModuleName = mainBundleName;
    
    XTBundleProvider *mainBundleProvider = [[XTBundleProvider alloc] init];
    XTBundleData *mainBundleData = [[XTBundleData alloc] initWithJSBundleName:mainBundleName moduleName:mainModuleName codePushKey:mainDeploymentKey portNum:[XTJSBundleTool.shared getMainBundlePort] isMain:YES provider:mainBundleProvider];
    [bundleDataArray addObject:mainBundleData];
    
    NSArray *xtBundlesArray = [XTJSBundleTool.shared getAllSubBundles];
    for (NSDictionary *obj in xtBundlesArray) {
        XTBundleProvider *bundleProvider = [[XTBundleProvider alloc] init];
        XTBundleData *bundleData = [[XTBundleData alloc] initWithJSBundleName:obj[@"jsBundleName"] moduleName:obj[@"jsBundleName"] codePushKey:obj[@"codePushKey"] portNum:obj[@"port"] isMain:NO provider:bundleProvider];
        [bundleDataArray addObject:bundleData];
    }
    
    return bundleDataArray;
}

- (NSDictionary *_Nullable)multiBundleForLaunchOptions {
    return self.launchOption;
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feture is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
    // Switch this bool to turn on and off the concurrent root
    return true;
}

#if RCT_NEW_ARCH_ENABLED

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
    _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                               delegate:self
                                                              jsInvoker:bridge.jsCallInvoker];
    return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
    return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
    return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
initParams:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
    return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
    return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif


@end
