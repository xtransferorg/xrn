//
//  XRNCustomKeyborad.h
//  xtapp
//
//  Created by  xupeng on 2025/9/1.
//  Copyright © 2025 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>
#import <XRNKeyboardModuleSpec/XRNKeyboardModuleSpec.h>

NS_ASSUME_NONNULL_BEGIN

@interface XRNCustomKeyborad : RCTEventEmitter <NativeXRNKeyboardModuleSpec>

@end

NS_ASSUME_NONNULL_END
