//
//  XTScanQRPlugin.swift
//  XRNTemplate
//
//  Created by  xtgq on 2024/10/8.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation

#if DEBUG
import swiftScan
#endif

@objcMembers
public class XTScanQRPlugin: NSObject {
    
    public static let shared = XTScanQRPlugin()
    
#if DEBUG
    @objc func startScan() {
        var style = LBXScanViewStyle()
        style.centerUpOffset = 44
        style.photoframeAngleStyle = LBXScanViewPhotoframeAngleStyle.Inner
        style.photoframeLineW = 2
        style.photoframeAngleW = 18
        style.photoframeAngleH = 18
        style.isNeedShowRetangle = false
        style.anmiationStyle = LBXScanViewAnimationStyle.LineMove
        style.colorAngle = UIColor(red: 0.0/255, green: 200.0/255.0, blue: 20.0/255.0, alpha: 1.0)
        style.animationImage = UIImage(named: "CodeScan.bundle/qrcode_Scan_weixin_Line")
        
        let vc = LBXScanViewController()
        vc.scanStyle = style
        vc.scanResultDelegate = self
        if let presentedVC = RCTPresentedViewController() {
            presentedVC.present(vc, animated: true, completion: nil)
        }
    }
#endif
    
}

#if DEBUG
extension XTScanQRPlugin: LBXScanViewControllerDelegate {
    public func scanFinished(scanResult: swiftScan.LBXScanResult, error: String?) {
        guard let scanContent = scanResult.strScanned else {
            return
        }
        
        if let scanContent = jsonStringToDictionary(scanContent), scanContent["action"] as? String == "action_set_bundle_host" {
            guard let urlString = scanContent["content"] as? String else {
                return
            }
            if let ipAddress = parseIP(from: urlString), let port = parsePort(from: urlString) {
                UserDefaults.standard.setValue(ipAddress, forKey: "RCT_jsLocation")
                UserDefaults.standard.synchronize()
                
                let bundles = XTJSBundleTool.shared().getAllBundleInfo()
                var bundleName = ""
                for bundle in bundles {
                    if let bundleDict = bundle as? [String: Any] {
                        if let portNum = bundleDict["port"] as? String {
                            if portNum == port {
                                bundleName = bundleDict["bundleName"] as? String ?? ""
                                break
                            }
                        }
                    }
                }
                if !bundleName.isEmpty {
                    UserDefaults.standard.set("1", forKey: "\(bundleName)-debug")
                    UserDefaults.standard.synchronize()
                }
                
                XRNToastView.shared().showToast("ip地址绑定成功，重启APP生效！", duration: 3)
                DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                    exit(0)
                }
            } else {
                XRNToastView.shared().showToast("ip地址解析失败！", duration: 3)
                if let presentedVC = RCTPresentedViewController() {
                    presentedVC.dismiss(animated: true, completion: nil)
                }
            }
        } else {
            XRNToastView.shared().showToast("ip地址解析失败！", duration: 3)
            if let presentedVC = RCTPresentedViewController() {
                presentedVC.dismiss(animated: true, completion: nil)
            }
        }
    }
}
#endif

func parseIP(from urlString: String) -> String? {
    if let url = URL(string: urlString) {
        return url.host
    }
    return nil
}

func parsePort(from urlString: String) -> String? {
    if let url = URL(string: urlString), let port = url.port {
        return String(port)
    }
    return nil
}

func jsonStringToDictionary(_ jsonString: String) -> [String: Any]? {
    guard let jsonData = jsonString.data(using: .utf8) else {
        print("Error converting string to Data")
        return nil
    }
    do {
        let jsonDictionary = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
        return jsonDictionary
    } catch {
        print("Error converting string to dictionary: \(error.localizedDescription)")
        return nil
    }
}
