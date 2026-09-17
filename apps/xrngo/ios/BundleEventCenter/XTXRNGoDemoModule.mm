//
//  XTXRNGoDemoModule.mm
//  xrngo
//
//  iOS 原生实现 XRNGODemoModule TurboModule（对齐 Android/Harmony 语义）。
//  - jumpMultiBundleDemo：弹出 bundle 列表页，点击行跳转对应子 bundle（对应 Android MultiBundleActivity + NavHelper.jump2Module）。
//  - handleOhCrash / handleOhRejectCrash：手动触发崩溃（对齐 Harmony demo）。
//

#import "XTXRNGoDemoModule.h"
#import "XTJSBundleTool.h"
#import "XTNativeRouterManager.h"
#import <React/RCTBridgeModule.h> // RCT_EXPORT_MODULE 宏定义在此
#import <UIKit/UIKit.h>

#pragma mark - Bundle 列表页（对齐 Android MultiBundleAdapter）

@interface XTBundleListViewController : UITableViewController
@property (nonatomic, strong) NSArray<NSDictionary *> *bundles;
@property (nonatomic, copy) void (^onSelectBundle)(NSString *bundleName);
@end

@implementation XTBundleListViewController

- (instancetype)initWithStyle:(UITableViewStyle)style {
  self = [super initWithStyle:style];
  if (self) {
    _bundles = @[];
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  self.title = @"多bundle管理";
  self.tableView.rowHeight = UITableViewAutomaticDimension;
  self.tableView.estimatedRowHeight = 96.0;
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc]
    initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                          target:self
                          action:@selector(close)];
}

- (void)close {
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  return self.bundles.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  static NSString *cellId = @"XTBundleListCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:cellId];
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:cellId];
    cell.selectionStyle = UITableViewCellSelectionStyleDefault;
  }

  NSDictionary *info = self.bundles[indexPath.row];
  NSString *name = [info objectForKey:@"jsBundleName"];
  BOOL isMain = [[info objectForKey:@"isMain"] boolValue];
  NSString *type = isMain ? @"主Bundle" : @"普通Bundle";
  NSString *codePushKey = [info objectForKey:@"codePushKey"] ?: @"";
  NSString *port = [[info objectForKey:@"port"] description] ?: @"";

  // 对齐 Android 行展示：名称 / 类型 / codePushKey / 本地服务端口
  NSString *text = [NSString stringWithFormat:
    @"bundle-%lu 名称：%@\n类型：%@\ncodePushKey：%@\n本地服务端口：%@",
    (unsigned long)(indexPath.row + 1), name, type, codePushKey, port];

  UILabel *label = [[UILabel alloc] init];
  label.numberOfLines = 0;
  label.font = [UIFont systemFontOfSize:14];
  label.text = text;
  label.translatesAutoresizingMaskIntoConstraints = NO;

  [cell.contentView.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];
  [cell.contentView addSubview:label];
  [NSLayoutConstraint activateConstraints:@[
    [label.topAnchor constraintEqualToAnchor:cell.contentView.topAnchor constant:8],
    [label.bottomAnchor constraintEqualToAnchor:cell.contentView.bottomAnchor constant:-8],
    [label.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:16],
    [label.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-16],
  ]];
  return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
  NSDictionary *info = self.bundles[indexPath.row];
  NSString *bundleName = [info objectForKey:@"jsBundleName"];
  if (!bundleName.length) {
    return;
  }
  void (^select)(NSString *) = self.onSelectBundle;
  [self dismissViewControllerAnimated:YES completion:^{
    if (select) {
      select(bundleName);
    }
  }];
}

@end

#pragma mark - XTXRNGoDemoModule

@interface XTXRNGoDemoModule ()
@property (nonatomic, strong) UINavigationController *bundleListVC; // 强引用持有，dismiss 后置 nil
@end

@implementation XTXRNGoDemoModule

RCT_EXPORT_MODULE(XRNGODemoModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXrnGODemoSpecJSI>(params);
}

- (void)jumpMultiBundleDemo {
  // TurboModule 方法在 JS 线程回调，present UI 须切主线程
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableArray<NSDictionary *> *bundles = [NSMutableArray array];
    // 主 bundle
    NSString *mainName = [XTJSBundleTool.shared getMainBundleName];
    NSString *mainPort = [XTJSBundleTool.shared getMainBundlePort];
    if (mainName.length) {
      [bundles addObject:@{
        @"jsBundleName": mainName,
        @"isMain": @YES,
        @"codePushKey": @"",
        @"port": mainPort ?: @"",
      }];
    }
    // 子 bundle 列表（xtBundles.plist）
    [bundles addObjectsFromArray:[XTJSBundleTool.shared getAllSubBundles]];

    XTBundleListViewController *listVC = [[XTBundleListViewController alloc] initWithStyle:UITableViewStylePlain];
    listVC.bundles = [bundles copy];
    __weak __typeof(self) weakSelf = self;
    listVC.onSelectBundle = ^(NSString *bundleName) {
      // 对齐 Android NavHelper.jump2Module(activity, bundleName, bundleName, "")
      [[XTNativeRouterManager shared] pushViewController:bundleName
                                              moduleName:bundleName
                                         initialProperties:nil
                                                replace:NO];
      weakSelf.bundleListVC = nil;
    };

    UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:listVC];
    nav.modalPresentationStyle = UIModalPresentationPageSheet;
    self.bundleListVC = nav;

    UIViewController *rootVC = UIApplication.sharedApplication.windows.firstObject.rootViewController;
    while (rootVC.presentedViewController) {
      rootVC = rootVC.presentedViewController;
    }
    [rootVC presentViewController:nav animated:YES completion:nil];
  });
}

- (void)handleOhCrash {
  @throw [NSException exceptionWithName:@"XRNGoDemoCrash"
                                 reason:@"手动触发iOS崩溃"
                               userInfo:nil];
}

- (void)handleOhRejectCrash {
  dispatch_async(dispatch_get_main_queue(), ^{
    @throw [NSException exceptionWithName:@"XRNGoDemoRejectCrash"
                                   reason:@"异步Promise reject模拟"
                                 userInfo:nil];
  });
}

@end
