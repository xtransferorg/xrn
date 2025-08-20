//
//  XTBundleData.m
//  AwesomeProject
//
//  Created by  liyuan on 2025/3/28.
//

#import "XTBundleData.h"

@interface XTBundleData ()

@property (nonatomic, copy) NSString *jsBundleName;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSString *codePushKey;
@property (nonatomic, copy) NSString *portNum;
@property (nonatomic, assign) BOOL isMain;
@property (nonatomic, strong, nonnull) id<XTBundleProvider> provider;

@end

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

@end
