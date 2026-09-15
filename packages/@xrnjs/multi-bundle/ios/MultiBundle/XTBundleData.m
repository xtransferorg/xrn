//
//  XTBundleData.m
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/28.
//

#import "XTBundleData.h"
#import "XTJSBridgePool.h"

@implementation XTBundleData

- (instancetype)initWithJSBundleName:(NSString *)jsBundleName
                          moduleName:(NSString *)moduleName
                         codePushKey:(NSString *)codePushKey
                             portNum:(NSString *)portNum
                              isMain:(BOOL)isMain
                            provider:(id<XTBundleProvider> _Nonnull)provider {
  self = [super init];
  if (self) {
      self.jsBundleName = jsBundleName;
      self.moduleName = moduleName;
      self.codePushKey = codePushKey;
      self.portNum = portNum;
      self.isMain = isMain;
      self.provider = provider;
  }
  return self;
}

- (void)dealloc {
	CPLog2(@"🔴 XTBundleData dealloc: %@ (provider: %@)", self, self.provider);
}

@end
