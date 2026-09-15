@objc(XRNAppUtilsModuleImpl)
public class XRNAppUtilsModuleImpl: NSObject {
  
  @objc public func exitApp() -> Bool {
//    resolve(NSNumber(value: true))
    NotificationCenter.default.post(name: UIApplication.willTerminateNotification, object: nil)
    // exitApp前，释放所有 Host / Bridge runtime
    if let contexts = XTMultiBundleManager.shared().pool?.fetchAllRuntimeContext() as? [XTJSRuntimeContext] {
      contexts.forEach { context in
        DispatchQueue.main.async {
          context.invalidateRuntime()
        }
      }
    }
    
    // 延迟1s，防止执行了exit，App还有一些任务没处理完
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      exit(0)
    }
    return true
  }
  
  @objc public func relaunchApp() -> Bool {
    return true
  }
  
  @objc public func moveTaskToBack() -> Bool {
    return true
  }
  
  @objc public func installApp() -> Bool {
    return true
  }
  
  @objc public func isAppInstalled(_ scheme: String) -> NSNumber {
    // ios 这边通过url schem 判断应用是否安装
    guard let urlStr = URL(string: scheme) else {
      return NSNumber(value: false)
    }
    
    let isInstalled = UIApplication.shared.canOpenURL(urlStr)
    return NSNumber(value: isInstalled)
  }
  
  @objc public func isAppRooted(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    let result = XTJailBreakTool.isJailbroken()
    resolve(NSNumber(value: result))
  }
  
  @objc public func isGooglePlayStoreInstalled(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    resolve(NSNumber(value: false))
  }

  @objc public func launchAppDetail(_ appPkgName: String, marketPgkName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    resolve(NSNumber(value: false))
  }
  
  @objc public func checkSysIntegrity(_ nonce: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    resolve([:])
  }
  
}
