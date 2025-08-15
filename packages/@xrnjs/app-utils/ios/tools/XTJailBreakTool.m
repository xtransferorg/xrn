//
//  XTJailBreakTool.m
//  xtapp
//
//  Created by  liyuan on 2024/12/10.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "XTJailBreakTool.h"

@implementation XTJailBreakTool

// iOS jailbeak has many manners, this one can contain Taurine jailbreak!
+ (BOOL)isJailbroken {
#if TARGET_OS_SIMULATOR
  return NO;
#else
  NSArray *files = @[
    @"/private/var/lib/apt",
    @"/Applications/Cydia.app",
    @"/Applications/RockApp.app",
    @"/Applications/Icy.app",
    @"/Applications/WinterBoard.app",
    @"/Applications/SBSetttings.app",
    @"/Applications/blackra1n.app",
    @"/Applications/IntelliScreen.app",
    @"/Applications/Snoop-itConfig.app",
    @"/bin/sh",
    @"/usr/libexec/sftp-server",
    @"/usr/libexec/ssh-keysign /Library/MobileSubstrate/MobileSubstrate.dylib",
    @"/bin/bash",
    @"/usr/sbin/sshd",
    @"/etc/apt /System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
    @"/System/Library/LaunchDaemons/com.ikey.bbot.plist",
    @"/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
    @"/Library/MobileSubstrate/DynamicLibraries/Veency.plist"
  ];
  
  NSFileManager *fileManager = [NSFileManager defaultManager];
  
  for (NSString *file in files) {
    if ([fileManager fileExistsAtPath:file]) {
      return YES;
    }
  }
  
  return NO;
#endif
}

@end
