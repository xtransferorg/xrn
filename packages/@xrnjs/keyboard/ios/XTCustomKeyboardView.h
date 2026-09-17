//
//  XTCustomKeyboardView.h
//  xtapp
//
//  Created by  xupeng on 2025/9/3.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface XTCustomKeyboardView : UIView

- (instancetype)initWithDecimalType:(nonnull NSString *)decimalType initFastDatas:(nonnull NSArray *)initFastDatas fastDatas:(nonnull NSArray *)fastDatas doneTitleStr:(NSString *)doneTitleStr textField:(UITextField *)textField;

@end

NS_ASSUME_NONNULL_END
