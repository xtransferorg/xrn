//
//  RCTBridge+XTPrivate.h
//  xtapp
//
//  Created by  liyuan on 2024/8/28.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <React/RCTBridge.h>

@interface RCTBridge (XTPrivate)

@property (atomic, strong) RCTBridge *batchedBridge;

- (void)executeSourceCode:(NSData *)sourceCode withSourceURL:(NSURL *)url sync:(BOOL)sync;

@end
