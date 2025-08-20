import Foundation
import React

@objc(XRNDebugToolsModule)
class XRNDebugToolsModule: NSObject {
	
	private var pingManager: XTPingTool?
	
	@objc(cleanAppCache:withRejecter:)
	func cleanAppCache(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		CacheTool.shared.clearCachesDirectory()
		resolve(true)
	}
	
	@objc(reloadBundle:withRejecter:)
	func reloadBundle(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			RCTTriggerReloadCommandListeners("Dev menu - reload")
		}
		resolve(true)
	}
	
	@objc(getAllBundlesDataSync:withRejecter:)
	func getAllBundlesDataSync(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		let bundles = XTJSBridgePool.shared().fetchAllJSBridge()
		if bundles.count > 0 {
			var result = [[String: Any]]()
			bundles.forEach { bridge in
				result.append(["bundleName": bridge.xt_jsBundleName ?? ""])
			}
			resolve(result)
		} else {
			resolve([])
		}
	}
	
	@objc(nativeCrash:withRejecter:)
	func nativeCrash(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		let array = [1, 2, 3]
		// 模拟Crash
		print(array[4])
		resolve(true)
	}
	
	@objc(routeInfo:withRejecter:)
	func routeInfo(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			guard let result = self.getRouteInfo() else {
				resolve([])
				return
			}
			resolve(result)
		}
	}
	
	@objc(toggleInspector:withRejecter:)
	func toggleInspector(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last else {
				resolve(false)
				return
			}
			
			var bridge: RCTBridge? = nil
			if let vc = stackTopVC as? XTBaseBundleViewController {
				bridge = vc.bridge
			}
			
			if let devSettings = bridge?.moduleRegistry.module(forName: "DevSettings") as? RCTDevSettings {
				devSettings.toggleElementInspector()
			}
			
			resolve(true)
		}
	}
	
	@objc(getInspectorIsShown:withRejecter:)
	func getInspectorIsShown(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last else {
				resolve(false)
				return
			}
			
			var bridge: RCTBridge? = nil
			if let vc = stackTopVC as? XTBaseBundleViewController {
				bridge = vc.bridge
			}
			if let devSettings = bridge?.moduleRegistry.module(forName: "DevSettings") as? RCTDevSettings {
				// 获取Inspector 是否开启的状态
				let isShown = devSettings.isElementInspectorShown
				resolve(isShown)
				return
			}
			resolve(false)
		}
	}
	
	@objc(togglePerfMonitor:withRejecter:)
	func togglePerfMonitor(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last else {
				resolve(false)
				return
			}
			
			var bridge: RCTBridge? = nil
			if let vc = stackTopVC as? XTBaseBundleViewController {
				bridge = vc.bridge
			}
			if let devSettings = bridge?.moduleRegistry.module(forName: "DevSettings") as? RCTDevSettings {
				// 获取到RCTPerfMonitor 实例
				guard let perfMonitor = bridge?.moduleRegistry.module(forName: "PerfMonitor") else {
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
			}
			
			resolve(true)
		}
	}
	
	@objc(getPerfMonitorIsShown:withRejecter:)
	func getPerfMonitorIsShown(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
		DispatchQueue.main.async {
			guard let nvc = XTNativeRouterManager.shared().nav, let stackTopVC = nvc.viewControllers.last else {
				resolve(false)
				return
			}
			
			var bridge: RCTBridge? = nil
			if let vc = stackTopVC as? XTBaseBundleViewController {
				bridge = vc.bridge
			}
			if let devSettings = bridge?.moduleRegistry.module(forName: "DevSettings") as? RCTDevSettings {
				// 获取PerfMonitor 是否开启的状态
				let isShown = devSettings.isPerfMonitorShown
				resolve(isShown)
				return
			}
			resolve(false)
		}
	}
	
	@objc(pingStart:withResolver:withRejecter:)
	func pingStart(host: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
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
	
	@objc(dnsStart:withResolver:withRejecter:)
	func dnsStart(host: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
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
			} else {
				resolve(["host": host, "ip": ""])
			}
		}
	}
	
	@objc(proxyInfo:withResolver:withRejecter:)
	func proxyInfo(url: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		let proxyInfo = XTProxyTool.shared.getProxyInfo(url: url)
		if !proxyInfo.isEmpty {
			resolve(proxyInfo)
		} else {
			resolve("")
		}
	}
	
	private func getRouteInfo() -> [[String: Any]]? {
		guard let nvc = XTNativeRouterManager.shared().nav else {
			return nil
		}
		
		var mouduleStack: [[String: Any]] = []
		for viewController in nvc.viewControllers {
			var tempObj = [String: Any]()
			
			if let mainVC = viewController as? XTBaseBundleViewController {
				let bridge = mainVC.bridge
				let bundleName = bridge.xt_jsBundleName ?? ""
				tempObj["bundleName"] = bundleName
				tempObj["moduleName"] = mainVC.moduleName
			}
			
			mouduleStack.append(tempObj)
		}
		
		return mouduleStack
	}
	
}
