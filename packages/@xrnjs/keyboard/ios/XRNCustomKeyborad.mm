//
//  XRNCustomKeyborad.m
//  xtapp
//
//  Created by  xupeng on 2025/9/1.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XRNCustomKeyborad.h"
#import <React/RCTUITextField.h>
#import <React/RCTTextInputComponentView.h>
#import "XTJSBundleTool.h"
#import "XTCustomKeyboardView.h"
#import <objc/runtime.h>

@interface XRNCustomKeyborad()

@property (nonatomic, copy) NSString  *mode;      // 键盘适配模式
@property (nonatomic, copy) NSDictionary *extra;  // 键盘适配额外信息

@end

@implementation XRNCustomKeyborad

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeXRNKeyboardModuleSpecJSI>(params);
}


RCT_EXPORT_MODULE(XRNKeyboard);

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}


+ (instancetype)shareInstance {
  static XRNCustomKeyborad *_sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _sharedInstance = [[XRNCustomKeyborad alloc] init];
  });
  return _sharedInstance;
}

#define keyboardTypeSystemKey @"system"
#define keyboardTypeAmountKey @"amount"

RCT_EXPORT_METHOD(setKeyboard:(double)reactTag
                  keyboardType:(NSString *)keyboardType
                  scrollTag:(double)scrollTag
                  keyboardInfo:(JS::NativeXRNKeyboardModule::AmountInfo &)keyboardInfo
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSString *decimalType = keyboardInfo.decimalType();
    NSArray *initFastDatas = [self getInitFastDataArray:keyboardInfo];
    NSArray *fastDatas = [self getfastDataArray:keyboardInfo];
    NSString *doneTitle = keyboardInfo.doneDesc();
    if (doneTitle.length == 0) {
      doneTitle = @"完成";
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        NSNumber *tagNumber = @(reactTag);
        UIView *view = [self.viewRegistry_DEPRECATED viewForReactTag:tagNumber];
        if (!view || ![view isKindOfClass:[RCTTextInputComponentView class]]) {
            resolve(@(NO));
            return;
        }
        
        UIView *tmpView = nil;
        for (UIView *subview in view.subviews) {
            if ([subview isKindOfClass:[RCTUITextField class]]) {
                tmpView = subview;
                break;
            }
        }
        if (tmpView == nil) {
            resolve(@(NO));
            return;
        }
        
        RCTUITextField *textField = (RCTUITextField *)tmpView;
        if ([keyboardType isEqualToString:keyboardTypeAmountKey]) {
            // 创建自定义键盘
            XTCustomKeyboardView *decimaleyboard = [[XTCustomKeyboardView alloc] initWithDecimalType:decimalType initFastDatas:initFastDatas fastDatas:fastDatas doneTitleStr:doneTitle textField:textField];
            textField.inputView = decimaleyboard;
            [textField reloadInputViews];
        } else {
            // 恢复为系统键盘
            textField.inputView = nil;
            textField.inputAccessoryView = nil;
            [textField reloadInputViews];
        }

        resolve(@(YES));
    });
}

- (NSArray *)getInitFastDataArray:(JS::NativeXRNKeyboardModule::AmountInfo &)keyboardInfo {
  auto optionalArray = keyboardInfo.initFastDataArray();
  NSArray *dataArray = nil;
  if (optionalArray.has_value()) {
    const auto &vector = optionalArray.value();
    NSMutableArray *tempArray = [NSMutableArray array];
    for (NSString *str : vector) {
      [tempArray addObject:str ?: @""];
    }
    dataArray = [tempArray copy];
  } else {
    dataArray = @[];
  }
  return dataArray;
}

- (NSArray *)getfastDataArray:(JS::NativeXRNKeyboardModule::AmountInfo &)keyboardInfo {
  auto optionalArray = keyboardInfo.fastDataArray();
  NSArray *dataArray = nil;
  if (optionalArray.has_value()) {
    const auto &vector = optionalArray.value();
    NSMutableArray *tempArray = [NSMutableArray array];
    for (NSString *str : vector) {
      [tempArray addObject:str ?: @""];
    }
    dataArray = [tempArray copy];
  } else {
    dataArray = @[];
  }
  return dataArray;
}

- (void)setMode:(NSString *)mode {
    _mode = mode;
}

- (void)setExtra:(NSDictionary *)extra {
    _extra = extra;
}


RCT_EXPORT_METHOD(setSoftInputMode:(NSString *)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [XRNCustomKeyborad shareInstance].mode = mode;
  resolve(@(YES));
}


RCT_EXPORT_METHOD(setPageSoftInputMode:(NSString *)mode
                  extra:(NSDictionary *)extra
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [XRNCustomKeyborad shareInstance].mode = mode;
    [XRNCustomKeyborad shareInstance].extra = extra;
    resolve(@(YES));
}

// 修改时需要与IQKeyBoardManager中同时修改
#define keyboardContentNativeIdKey @"keyboard_content_native_id"
RCT_EXPORT_METHOD(getKeyboardContentNativeID:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  resolve(keyboardContentNativeIdKey);
}


@end
