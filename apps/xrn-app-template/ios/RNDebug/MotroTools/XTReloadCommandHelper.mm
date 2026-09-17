//
//  XTReloadCommandHelper.mm
//  xrngo
//

#import "XTReloadCommandHelper.h"

#import <React/RCTReloadCommand.h>
#import <React/RCTDevMenu.h>
#import <ReactCommon/RCTHost.h>
#import <react-native-xrn-multi-bundle/XTMultiBundle.h>
#import <react-native-xrn-multi-bundle/XTJSBridgeDelegation.h>
#import "XTJSBundleTool.h"

static NSString *XTReloadCommandPortStringFromURL(NSURL *_Nullable url)
{
  if (!url) {
    return nil;
  }
  if (url.port != nil) {
    return url.port.stringValue;
  }
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
  return components.port.stringValue;
}

static NSString *XTReloadCommandPortFromJsLocation(void)
{
  NSString *jsLocation = [[NSUserDefaults standardUserDefaults] stringForKey:@"RCT_jsLocation"];
  if (jsLocation.length == 0) {
    return nil;
  }
  NSRange colonRange = [jsLocation rangeOfString:@":" options:NSBackwardsSearch];
  if (colonRange.location == NSNotFound) {
    return nil;
  }
  return [jsLocation substringFromIndex:colonRange.location + 1];
}

static NSString *XTReloadCommandTargetPort(NSURL *_Nullable commandBundleURL)
{
  NSString *port = XTReloadCommandPortStringFromURL(commandBundleURL);
  if (port.length > 0) {
    return port;
  }
  return XTReloadCommandPortFromJsLocation();
}

static XTJSRuntimeContext *_Nullable XTReloadCommandContextForHost(RCTHost *host)
{
  if (!host) {
    return nil;
  }
  for (XTJSRuntimeContext *context in [[XTJSBridgePool shared] fetchAllRuntimeContext]) {
    if (context.host == host) {
      return context;
    }
  }
  return nil;
}

static BOOL XTReloadCommandShouldReloadContext(XTJSRuntimeContext *context, NSURL *_Nullable commandBundleURL)
{
  if (!context || !context.host) {
    return NO;
  }

  NSURL *bizURL = context.bizBundleURL;
  if (!bizURL || bizURL.isFileURL) {
    return NO;
  }

  NSString *targetPort = XTReloadCommandTargetPort(commandBundleURL);
  NSString *hostPort = XTReloadCommandPortStringFromURL(bizURL);
  if (targetPort.length == 0 || hostPort.length == 0) {
    return NO;
  }
  return [targetPort isEqualToString:hostPort];
}

#ifdef __cplusplus
extern "C" {
#endif

void XTReloadCommandUpdateBundleURLFromCurrentContext(void)
{
  XTJSRuntimeContext *context = [[XTJSBundleTool shared] fetchCurrentContext];
  NSURL *bizURL = context.bizBundleURL;
  if (bizURL && !bizURL.isFileURL) {
    RCTReloadCommandSetBundleURL(bizURL);
  }
}

void XTReloadCommandPrepareMatchingHosts(NSURL *_Nullable commandBundleURL)
{
  for (XTJSRuntimeContext *context in [[XTJSBridgePool shared] fetchAllRuntimeContext]) {
    if (!XTReloadCommandShouldReloadContext(context, commandBundleURL)) {
      continue;
    }
    XTJSBridgeDelegation *delegation = [[XTJSBridgePool shared] delegationForContext:context];
    [delegation prepareForHostReload];
  }
}

BOOL XTReloadCommandShouldReloadListener(id listener, NSURL *_Nullable commandBundleURL)
{
  if (![listener isKindOfClass:[RCTHost class]]) {
    return YES;
  }
  return XTReloadCommandShouldReloadContext(XTReloadCommandContextForHost((RCTHost *)listener), commandBundleURL);
}

BOOL XTDevMenuShouldPresentOnShake(id devMenu)
{
  if (!devMenu) {
    return NO;
  }
  XTJSRuntimeContext *context = [[XTJSBundleTool shared] fetchCurrentContext];
  if (!context) {
    return NO;
  }
  id currentDevMenu = [context moduleForClass:[RCTDevMenu class]];
  return currentDevMenu == devMenu;
}

#ifdef __cplusplus
}
#endif
