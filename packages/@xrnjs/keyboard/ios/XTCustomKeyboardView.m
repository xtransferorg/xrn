//
//  XTCustomKeyboardView.m
//  xtapp
//
//  Created by  xupeng on 2025/9/3.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import "XTCustomKeyboardView.h"

@interface XTCustomKeyboardView ()

@property (nonatomic, copy) NSString *decimalType;
@property (nonatomic, copy) NSArray <NSString *> *nitFastDatas;
@property (nonatomic, copy) NSArray <NSString *> *fastDatas;
@property (nonatomic, copy) NSString *doneTitleStr;

@property (nonatomic, strong) NSArray<NSString *> *mainTitles;
@property (nonatomic, strong) NSDictionary *subTitles;

@property (nonatomic, weak) UITextField *weakTextField;
@property (nonatomic, strong) UIToolbar *customToolbar;
@property (nonatomic, strong) NSTimer *deleteTimer;

@end

@implementation XTCustomKeyboardView

- (instancetype)initWithDecimalType:(nonnull NSString *)decimalType initFastDatas:(nonnull NSArray *)initFastDatas fastDatas:(nonnull NSArray *)fastDatas doneTitleStr:(NSString *)doneTitleStr textField:(UITextField *)textField {
    CGFloat height = 46 * 4 + 72 + [UIApplication sharedApplication].windows.firstObject.safeAreaInsets.bottom;
    self = [super initWithFrame:CGRectMake(0, 0, [UIScreen mainScreen].bounds.size.width, height)];
    if (self) {
        self.decimalType = decimalType;
        if (initFastDatas.count > 3) {
            self.nitFastDatas = [initFastDatas subarrayWithRange:NSMakeRange(0, 3)];
        } else {
            self.nitFastDatas = initFastDatas;
        }
        if (fastDatas.count > 3) {
            self.fastDatas = [fastDatas subarrayWithRange:NSMakeRange(0, 3)];
        } else {
            self.fastDatas = fastDatas;
        }
    
        self.doneTitleStr = doneTitleStr;
        self.weakTextField = textField;
        
        [self initDatas];
        [self setupCustomToolbar];
        [self setupView];
    }
    return self;
}

/// 数据初始化
- (void)initDatas {
    self.mainTitles = @[@"1", @"2", @"3", @"4", @"5", @"6", @"7", @"8", @"9", @".", @"0"];
    self.subTitles = @{
        @"2": @"A B C",
        @"3": @"D E F",
        @"4": @"G H I",
        @"5": @"J K L",
        @"6": @"M N O",
        @"7": @"P Q R S",
        @"8": @"T U V",
        @"9": @"W X Y Z"
    };
}


// 布局键盘控件
- (void)setupView {
    self.backgroundColor = [UIColor colorWithRed:205/256.0 green:208/256.0 blue:212/256.0 alpha:1];
    
    for (NSInteger index = 0; index < 12; index++) {
        if (index == 9 && self.decimalType.length == 0) {
            continue;
        }
        
        UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
        CGFloat width = (self.frame.size.width - 22.0) / 3.0;
        CGFloat height = 47.0;
        CGFloat x = (CGFloat)(index % 3) * (width + 5.0) + 6.0;
        CGFloat y = (CGFloat)(index / 3) * (height + 6.0) + 6.0;
        
        button.frame = CGRectMake(x, y, width, height);
        button.layer.cornerRadius = 4.6;
        button.titleLabel.hidden = YES;
        
        if (index == 11 || index == 9) {
            button.backgroundColor = [UIColor clearColor];
        } else {
            button.backgroundColor = [UIColor whiteColor];
        }
        
        if (index == 11) {
            // 删除按钮
            UIImageView *deleteImageView = [[UIImageView alloc] initWithImage:[UIImage systemImageNamed:@"delete.left"]];
            deleteImageView.tintColor = [UIColor blackColor];
            deleteImageView.frame = CGRectMake((width - 29.0) / 2.0, (height - 22.5) / 2.0, 29, 22.5);
            [button addSubview:deleteImageView];
            
            [button addTarget:self action:@selector(inputDeleteTapped) forControlEvents:UIControlEventTouchUpInside];
          
            // 添加长按手势
            UILongPressGestureRecognizer *longPress = [[UILongPressGestureRecognizer alloc]
                initWithTarget:self
                action:@selector(handleLongPressDelete:)];
            longPress.minimumPressDuration = 0.5;
            [button addGestureRecognizer:longPress];
        } else {
            if (index != 9) {
                UIImage *deleteImg = [UIImage imageNamed:@"decimal_keyboard_itemBG" inBundle:[NSBundle mainBundle] compatibleWithTraitCollection:nil];
                [button setBackgroundImage:deleteImg forState:UIControlStateNormal];
            }
            
            NSString *title = index == 9 ? self.decimalType : self.mainTitles[index];
            button.titleLabel.text = title;
            UILabel *mainTitle = [[UILabel alloc] init];
            mainTitle.text = title;
            mainTitle.font = [UIFont systemFontOfSize:25.0 weight:UIFontWeightRegular];
            mainTitle.textColor = [UIColor blackColor];
            mainTitle.textAlignment = NSTextAlignmentCenter;
            
            if (index < 9) {
                mainTitle.frame = CGRectMake(0, 2.5, width, 26);
            } else {
                
                mainTitle.frame = CGRectMake(0, (height - 30.0) / 2.0, width, 30.0);
            }
            [button addSubview:mainTitle];
            
            NSString *subTitleText = self.subTitles[mainTitle.text];
            if (subTitleText) {
                UILabel *subTitle = [[UILabel alloc] init];
                subTitle.font = [UIFont systemFontOfSize:10.0 weight:UIFontWeightSemibold];
                subTitle.textColor = [UIColor blackColor];
                subTitle.textAlignment = NSTextAlignmentCenter;
                subTitle.frame = CGRectMake(0, CGRectGetMaxY(mainTitle.frame), width, 13.14);
                subTitle.text = subTitleText;
                [button addSubview:subTitle];
            }
            
            [button addTarget:self action:@selector(inputItemTapped:) forControlEvents:UIControlEventTouchUpInside];
        }
        
        [self addSubview:button];
    }
}

#pragma mark - Toolbar Methods

/// 创建快捷输入Toolbar
- (void)setupCustomToolbar {
    if ((self.nitFastDatas.count == 0 && self.fastDatas.count == 0) || self.customToolbar) {
        return;
    }
    self.customToolbar = [[UIToolbar alloc] initWithFrame:CGRectMake(0, 0, [UIScreen mainScreen].bounds.size.width, 44)];
    if (self.weakTextField.text.length > 0) {
        [self updateCustomToolbarWithDatas:self.fastDatas];
    } else {
        [self updateCustomToolbarWithDatas:self.nitFastDatas];
    }

    self.weakTextField.inputAccessoryView = self.customToolbar;
    [self setupTextFieldObserver];
}

- (void)dealloc {
    [self.weakTextField removeObserver:self forKeyPath:@"text"];
    [self.weakTextField removeObserver:self forKeyPath:@"attributedText"];
    [self.deleteTimer invalidate];
    self.deleteTimer = nil;
}

- (void)setupTextFieldObserver {
    [self.weakTextField addObserver:self
                         forKeyPath:@"text"
                            options:NSKeyValueObservingOptionNew
                            context:nil];
    [self.weakTextField addObserver:self
                         forKeyPath:@"attributedText"
                            options:NSKeyValueObservingOptionNew
                            context:nil];
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
    if ([keyPath isEqualToString:@"text"]) {
        NSString *newText = change[NSKeyValueChangeNewKey];
        [self updateCustomToolbarWithText:newText];
    } else if ([keyPath isEqualToString:@"attributedText"]) {
        NSAttributedString *newText = change[NSKeyValueChangeNewKey];
        [self updateCustomToolbarWithText:newText.string];
    }
}

- (void)updateCustomToolbarWithText:(NSString *)newText {
    if (newText.length == 0) {
        [self updateCustomToolbarWithDatas:self.nitFastDatas];
    } else {
        [self updateCustomToolbarWithDatas:self.fastDatas];
    }
}

/// 更新快捷输入Toolbar
- (void)updateCustomToolbarWithDatas:(NSArray *)datas {
    if (datas.count == 0) {
        [self updateCustomToolbarWithNoDatas];
        return;
    }
    UIBarButtonItem *flexibleSpace = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
    
    NSMutableArray<UIBarButtonItem *> *items = [NSMutableArray arrayWithObject:flexibleSpace];
    for (id data in datas) {
        NSString *title = [NSString stringWithFormat:@"%@", data];
        UIBarButtonItem *button = [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStylePlain target:self action:@selector(toolbarItemTapped:)];
        button.tintColor = [UIColor blackColor];
        [items addObject:button];
        [items addObject:flexibleSpace];
        [items addObject:[self separatorItem]];
        [items addObject:flexibleSpace];
    }
    
    UIBarButtonItem *doneButton = [[UIBarButtonItem alloc] initWithTitle:self.doneTitleStr ? : @"完成" style:UIBarButtonItemStyleDone target:self action:@selector(toolbarDoneTapped)];
    [items addObject:doneButton];
    [items addObject:flexibleSpace];
    
    self.customToolbar.items = items;
}

/// 更新快捷输入Toolbar
- (void)updateCustomToolbarWithNoDatas {
    UIBarButtonItem *flexibleSpace = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
    NSMutableArray<UIBarButtonItem *> *items = [NSMutableArray arrayWithObject:flexibleSpace];
    [items addObject:flexibleSpace];
    UIBarButtonItem *doneButton = [[UIBarButtonItem alloc] initWithTitle:self.doneTitleStr ? : @"完成" style:UIBarButtonItemStyleDone target:self action:@selector(toolbarDoneTapped)];
    [items addObject:doneButton];
    
    self.customToolbar.items = items;
}

- (UIBarButtonItem *)separatorItem {
    UIView *view = [[UIView alloc] init];
    view.backgroundColor = [UIColor lightGrayColor];
    view.translatesAutoresizingMaskIntoConstraints = NO;
    [view.widthAnchor constraintEqualToConstant:1].active = YES;
    [view.heightAnchor constraintEqualToConstant:25].active = YES;
    return [[UIBarButtonItem alloc] initWithCustomView:view];
}

#pragma mark - Action Methods

- (void)toolbarItemTapped:(UIBarButtonItem *)sender {
    NSString *numString = [self getDecimalFromString:sender.title];
    [self.weakTextField insertText:numString];
}

- (NSString *)getDecimalFromString:(NSString *)inputString {
    NSCharacterSet *digitCharacterSet = [NSCharacterSet decimalDigitCharacterSet];
    NSCharacterSet *nonDigitCharacterSet = [digitCharacterSet invertedSet];
    NSArray *components = [inputString componentsSeparatedByCharactersInSet:nonDigitCharacterSet];
    NSString *result = [components componentsJoinedByString:@""];
    return result;
}

- (void)toolbarDoneTapped {
    [self.weakTextField resignFirstResponder];
}

- (void)inputItemTapped:(UIButton *)sender {
    [self.weakTextField insertText:sender.titleLabel.text ?: @""];
    [self updateCustomToolbarWithText:self.weakTextField.text];
}

- (void)inputDeleteTapped {
    [self.weakTextField deleteBackward];
    [self updateCustomToolbarWithText:self.weakTextField.text];
}

- (void)handleLongPressDelete:(UILongPressGestureRecognizer *)gesture {
    if (gesture.state == UIGestureRecognizerStateBegan) {
        // 立即删除一次
        [self inputDeleteTapped];
        self.deleteTimer = [NSTimer scheduledTimerWithTimeInterval:0.1
                                                           target:self
                                                         selector:@selector(inputDeleteTapped)
                                                         userInfo:nil
                                                          repeats:YES];
        
    } else if (gesture.state == UIGestureRecognizerStateEnded ||
               gesture.state == UIGestureRecognizerStateCancelled) {
        [self.deleteTimer invalidate];
        self.deleteTimer = nil;
    }
}


@end
