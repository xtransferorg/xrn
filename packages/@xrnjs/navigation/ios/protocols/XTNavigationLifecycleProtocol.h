//
//  XTNavigationLifecycleProtocol.h
//  xtapp
//
//  Created by  xtgq on 2025/5/7.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol XTNavigationLifecycleProtocol <NSObject>

@required
- (void)didShowViewController:(UIViewController *)viewController
                 moduleName:(NSString *)moduleName
                 bundleName:(NSString *)bundleName
                    vcLevel:(NSString *)vcLevel;

- (void)didShowViewControllerWithError:(NSString *)errorDesc;

@end

NS_ASSUME_NONNULL_END
