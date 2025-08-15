@objc(XRNAppUtilsModule)
class XRNAppUtilsModule: NSObject {

	@objc(exitApp:withRejecter:)
	func exitApp(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
		
		resolve(NSNumber(value: true))
		exit(0)
	}
    
    @objc
    func relaunchApp() -> Void {
        
    }
    
    @objc
    func moveTaskToBack() -> Void {
        
    }
    
    @objc
    func installApp() -> Void {
        
    }
    
    @objc
    func isAppInstalled(_ scheme: String) -> NSNumber {
        // ios 这边通过url schem 判断应用是否安装
        guard let urlStr = URL(string: scheme) else {
            return NSNumber(value: false)
        }
        
        let isInstalled = UIApplication.shared.canOpenURL(urlStr)
        return NSNumber(value: isInstalled)
    }
    
    @objc(isAppRooted:withRejecter:)
    func isAppRooted(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let result = XTJailBreakTool.isJailbroken()
        resolve(NSNumber(value: result))
    }
    
    @objc(isGooglePlayStoreInstalled:withRejecter:)
    func isGooglePlayStoreInstalled(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        resolve(NSNumber(value: false))
    }
    
    @objc(launchAppDetail:marketPgkName:withResolver:withRejecter:)
    func launchAppDetail(appPkgName: String, marketPgkName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(NSNumber(value: false))
    }
    
}
