//
//  XTProxyTool.swift
//  xtapp
//
//  Created by  xtgq on 2025/3/20.
//  Copyright © 2025 Facebook. All rights reserved.
//

import Foundation
import SystemConfiguration

class XTProxyTool {
    static let shared = XTProxyTool()

    private init() {}

    func getProxyInfo(url: String) -> [String: Any] {
        guard let url = URL(string: url) else {
            return ["ip": "", "port": "", "type": "invalid_url"]
        }
        
        // 获取网络代理信息
        guard let proxySettings = CFNetworkCopySystemProxySettings()?.takeRetainedValue(),
              let proxies = CFNetworkCopyProxiesForURL(url as CFURL, proxySettings).takeRetainedValue() as? [[String: Any]],
              let settings = proxies.first else {
            return ["ip": "", "port": "", "type": "unknown"]
        }
        
        let type = settings[kCFProxyTypeKey as String] as? String ?? "unknown"
        
        // 没有设置代理
        if type == kCFProxyTypeNone as String {
            return ["ip": "", "port": "", "type": type]
        }
        
        let ip = settings[kCFProxyHostNameKey as String] as? String ?? ""
        let port = (settings[kCFProxyPortNumberKey as String] as? NSNumber)?.stringValue ?? ""
        
        return ["ip": ip, "port": port, "type": type]
    }
}

