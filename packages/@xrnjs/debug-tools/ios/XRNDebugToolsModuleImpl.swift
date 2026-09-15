import Foundation
import React

@objc(XRNDebugToolsModuleImpl)
public class XRNDebugToolsModuleImpl: NSObject {
  
  private var pingManager: XTPingTool?
  
  var methodQueue: DispatchQueue {
    return DispatchQueue.main
  }
  
  class func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc public func cleanAppCache(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    CacheTool.shared.clearCachesDirectory()
    resolve(true)
  }
  
  @objc public func reloadBundle(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    guard let context = XTJSBundleTool.shared().fetchCurrentContext() else {
      resolve(false)
      return
    }
    context.requestReload()
    resolve(true)
  }
  
  @objc public func getAllBundlesDataSync(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    let contexts = XTJSBridgePool.shared().fetchAllRuntimeContext()
    if contexts.count > 0 {
      var result = [[String: Any]]()
      contexts.forEach { context in
        result.append(["bundleName": context.jsBundleName ?? ""])
      }
      resolve(result)
    } else {
      resolve([])
    }
  }
  
  @objc public func nativeCrash(_ resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    let array = [1, 2, 3]
    // 模拟Crash
    print(array[4])
    resolve(true)
  }
  
  @objc public func routeInfo(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      guard let result = self.getRouteInfo() else {
        resolve([])
        return
      }
      resolve(result)
    }
  }
  
  @objc public func toggleInspector(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last,
            let devSettings = self.devSettings(from: stackTopVC) else {
        resolve(false)
        return
      }
      devSettings.toggleElementInspector()
      resolve(true)
    }
  }
  
  @objc public func getInspectorIsShown(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last,
            let devSettings = self.devSettings(from: stackTopVC) else {
        resolve(false)
        return
      }
      resolve(devSettings.isElementInspectorShown)
    }
  }
  
  @objc public func togglePerfMonitor(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last,
            let context = self.runtimeContext(from: stackTopVC),
            let devSettings = self.devSettings(from: stackTopVC),
            let perfClass = NSClassFromString("RCTPerfMonitor"),
            let perfMonitor = context.module(for: perfClass) else {
        resolve(false)
        return
      }
        
      if devSettings.isPerfMonitorShown {
        if (perfMonitor as AnyObject).responds(to: Selector("hide")) {
          (perfMonitor as AnyObject).perform(Selector("hide"))
          devSettings.isPerfMonitorShown = false
        }
      } else {
        if (perfMonitor as AnyObject).responds(to: Selector("show")) {
          (perfMonitor as AnyObject).perform(Selector("show"))
          devSettings.isPerfMonitorShown = true
        }
      }
      
      resolve(true)
    }
  }
  
  @objc public func getPerfMonitorIsShown(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last,
            let devSettings = self.devSettings(from: stackTopVC) else {
        resolve(false)
        return
      }
      resolve(devSettings.isPerfMonitorShown)
    }
  }

  // MARK: - Memory leak (state toggle placeholder)

  @objc public func toggleMemoryLeak(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      let current = UserDefaults.standard.bool(forKey: "xrn_debugtools_memory_leak_enabled")
      UserDefaults.standard.set(!current, forKey: "xrn_debugtools_memory_leak_enabled")
      resolve(true)
    }
  }

  @objc public func getMemoryLeakIsShown(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      let current = UserDefaults.standard.bool(forKey: "xrn_debugtools_memory_leak_enabled")
      resolve(current)
    }
  }
  
  @objc public func pingStart(_ host: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
      self.pingManager = XTPingTool(hostName: host) {[weak self] host, time, error in
        guard let self = self else { return }
        self.pingManager?.stopPing()
        
        if (time > 0 && error == nil) {
          resolve(["host": host , "time": String(format: "%.2f", time)])
        } else {
          resolve(["host": host , "time": "0"])
        }
      }
      self.pingManager?.startPing()
    }
  }
  
  @objc public func dnsStart(_ host: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    let hostName = host
    let cfHost = CFHostCreateWithName(nil, hostName as CFString).takeRetainedValue()
    var streamError = CFStreamError()
    let cfHostStatus = CFHostStartInfoResolution(cfHost, .addresses, &streamError)
    if !cfHostStatus {
      resolve(["host": host, "ip": ""])
      return
    }
    
    var success: DarwinBoolean = false
    let cfHostAddresses = CFHostGetAddressing(cfHost, &success)?.takeUnretainedValue() as NSArray?
    guard let addresses = cfHostAddresses else {
      resolve(["host": host, "ip": ""])
      return
    }
    
    for case let address as NSData in addresses {
      var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
      if getnameinfo(address.bytes.assumingMemoryBound(to: sockaddr.self), socklen_t(address.length), &hostname, socklen_t(hostname.count), nil, 0, NI_NUMERICHOST) == 0 {
        guard let numAddress = String(validatingUTF8: hostname) else {
          resolve(["host": host, "ip": ""])
          return
        }
        print("Resolved IP address: \(numAddress)")
        resolve(["host": host, "ip": numAddress])
        return
      }
    }
    resolve(["host": host, "ip": ""])
  }
  
  @objc public func proxyInfo(_ url: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    let proxyInfo = XTProxyTool.shared.getProxyInfo(url: url)
    if !proxyInfo.isEmpty {
      resolve(proxyInfo)
    } else {
      resolve("")
    }
  }
  
  private func runtimeContext(from viewController: UIViewController) -> XTJSRuntimeContext? {
    (viewController as? XTBaseBundleViewController)?.runtimeContext
  }
  
  private func devSettings(from viewController: UIViewController) -> RCTDevSettings? {
    runtimeContext(from: viewController)?.module(for: RCTDevSettings.self) as? RCTDevSettings
  }
  
  private func getRouteInfo() -> [[String: Any]]? {
    guard let nvc = XTNativeRouterManager.shared().nav else {
      return nil
    }
    
    var mouduleStack: [[String: Any]] = []
    for viewController in nvc.viewControllers {
      var tempObj = [String: Any]()
      
      if let mainVC = viewController as? XTBaseBundleViewController {
        tempObj["bundleName"] = mainVC.runtimeContext.jsBundleName ?? ""
        tempObj["moduleName"] = mainVC.moduleName
      }
      
      mouduleStack.append(tempObj)
    }
    
    return mouduleStack
  }
  
  @objc public func registerDevBundle(_ bundleName: String, portStr: String) -> Bool {
    let bundleList = XTJSBundleTool().getBundleList()
    var deliveryType = "DYNAMIC"
    for bundleItem in bundleList {
      if let tmpItem = bundleItem as? [String: String],
         let tmpName = tmpItem["bundleName"],
         tmpName == bundleName {
        deliveryType = tmpItem["deliveryType"] ?? ""
      }
    }
		
    if deliveryType != "INNER" {
      var muDic: [String: String] = [:]
      muDic["bundleName"] = bundleName
      muDic["deploymentKey"] = ""
      muDic["port"] = portStr
      muDic["deliveryType"] = "DYNAMIC"
      XTJSBundleTool().saveBundleList([muDic])
    }
    
    var debugInfo = XTDebugStatus.shared.getDebugInfo(bundleName)
    debugInfo["enableDebug"] = "1"
    debugInfo["port"] = portStr
    XTDebugStatus.shared.saveDebugInfo(bundleName, debugInfo: debugInfo)
		
    return true
  }

}
