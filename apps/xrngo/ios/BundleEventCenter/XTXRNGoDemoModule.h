//
//  XTXRNGoDemoModule.h
//  xrngo
//
//  iOS 原生实现 XRNGODemoModule TurboModule（对齐 Android/Harmony 语义）。
//

#ifndef XTXRNGoDemoModule_h
#define XTXRNGoDemoModule_h

#import <Foundation/Foundation.h>
#import <ReactCodegen/XrnAppSpec/XrnAppSpec.h> // NativeXrnGODemoSpec 协议（codegen 生成）

NS_ASSUME_NONNULL_BEGIN

@interface XTXRNGoDemoModule : NSObject <NativeXrnGODemoSpec>
@end

NS_ASSUME_NONNULL_END

#endif /* XTXRNGoDemoModule_h */
