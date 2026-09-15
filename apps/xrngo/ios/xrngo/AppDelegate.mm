#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTColorSpaceUtils.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#import "xrngo-Swift.h"
#import "XTPluginManage.h"
#import "XTJSBundleTool.h"
#import "XTMainBundleViewController.h"
#import "XTNavigationViewController.h"
#import "XTNativeRouterManager.h"
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import "XTBundleProvider.h"
#import "XTBundleViewControllerFactory.h"

namespace {

class XTBridgelessFeatureFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override { return true; }
  bool enableFabricRenderer() override { return true; }
  bool useTurboModules() override { return true; }
  bool useNativeViewConfigsInBridgelessMode() override { return true; }
  bool enableFixForViewCommandRace() override { return true; }
};

} // namespace

@interface AppDelegate ()<XTMultiBundleDataSource>

@property (nonatomic, copy) NSDictionary *launchOption;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.automaticallyLoadReactNativeWindow = NO;
    RCTEnableTurboModule(YES);
    RCTSetNewArchEnabled(YES);
    // Host 路径未走 RCTAppDelegate._setUpFeatureFlags，须手动开启 ViewConfig interop，
    // 否则 BridgelessUIManager.getViewManagerConfig 不可用（gesture-handler / navigation 等报错）。
    facebook::react::ReactNativeFeatureFlags::override(std::make_unique<XTBridgelessFeatureFlags>());
    self.initialProps = @{};
    self.dependencyProvider = [RCTAppDependencyProvider new];
    [RCTColorSpaceUtils applyDefaultColorSpace:self.defaultColorSpace];
    [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = (id)self;

    self.launchOpptions = launchOptions;

    [XTMultiBundleManager shared].dataSource = self;
    [[XTMultiBundleManager shared] startUp];

    [self loadMainVC];

    [[XTPluginManage shareInstance] addSuspendBallToWindow];
    return YES;
}

- (void)loadMainVC {
    XTJSRuntimeContext *mainContext = [XTMultiBundleManager.shared.pool fetchContextWithJSBundleName:[[XTJSBundleTool shared] getMainBundleName]];
    NSString *mainModuleName = [XTMultiBundleManager.shared.pool fetchDefaultModuleNameWithJSBundleName:[[XTJSBundleTool shared] getMainBundleName]];

    XTBundleViewControllerFactory *bundleVCfactory = [[XTBundleViewControllerFactory alloc] init];
    [XTNativeRouterManager shared].bundleVCFactory = bundleVCfactory;
    XTMainBundleViewController *rootViewController = [[XTMainBundleViewController alloc] initWithRuntimeContext:mainContext moduleName:mainModuleName initialProperties:self.launchOption];
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

@end
