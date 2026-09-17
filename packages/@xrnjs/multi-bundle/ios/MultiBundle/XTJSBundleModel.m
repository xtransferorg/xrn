//
//  XTJSBundleModel.m
//  xtapp
//
//  Created by liyuan on 2023/11/1.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "XTJSBundleModel.h"
#import "XTJSBridgePool.h"

@implementation XTJSBundleModel

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
													moduleName:(NSString *)moduleName
												 codePushKey:(NSString *)codePushKey
														 portNum:(NSString *)portNum
															isMain:(BOOL)isMain
												 isPreLoaded:(BOOL)isPreLoaded
								bindTargetBundleName:(NSString *)bindTargetBundleName
													delegation:(nonnull XTJSBridgeDelegation *)delegation {
	self = [super init];
	if (self) {
		self.jsBundleName = jsBundleName;
		self.moduleName = moduleName;
		self.codePushKey = codePushKey;
		self.portNum = portNum;
		self.isMain = isMain;
		self.delegation = delegation;
		
		self.isPreLoaded = isPreLoaded;
		self.bindTargetBundleName = bindTargetBundleName;
	}
	return self;
}

- (void)dealloc {
	CPLog2(@"🔴 XTJSBundleModel dealloc: %@ (delegation: %@)", self, self.delegation);
}

@end
