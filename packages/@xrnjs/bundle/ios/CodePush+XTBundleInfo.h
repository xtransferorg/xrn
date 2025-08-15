//
//  CodePush+XTBundleinfo.h
//  xtapp
//
//  Created by  xtgq on 2024/6/6.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "CodePush.h"

NS_ASSUME_NONNULL_BEGIN

@interface CodePush (XTBundleInfo)

+ (NSDictionary *)getPackageForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error;

+ (NSDictionary *)getPreviousPackageForDeploymentKey:(NSString *)deploymentKey error:(NSError **)error;
@end

NS_ASSUME_NONNULL_END
