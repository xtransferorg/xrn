@objc(XRNNativeStorageModule)
class XRNNativeStorageModule: NSObject {

  @objc(getItem:withResolver:withRejecter:)
  func getItem(key: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    if key.isEmpty {
      resolve(nil)
      return
    }
    
    let localValue = UserDefaults.standard.object(forKey: key)
    if let val = localValue as? String {
      resolve(val)
    } else {
      resolve(nil)
    }
  }
  
  @objc(setItem:value:withResolver:withRejecter:)
  func setItem(key: String, value: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    if key.isEmpty || value.isEmpty {
      resolve(false)
      return
    }
    
    UserDefaults.standard.set(value, forKey: key)
    UserDefaults.standard.synchronize()
    resolve(true)
  }
  
  @objc(removeItem:withResolver:withRejecter:)
  func removeItem(key: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    if key.isEmpty {
      resolve(false)
      return
    }
    
    UserDefaults.standard.removeObject(forKey: key)
    UserDefaults.standard.synchronize()
    resolve(true)
  }
  
  // 同步获取UserDefaults数据
  @objc
  func getItemSync(_ key: String) -> String? {
    if key.isEmpty {
      return nil
    }
    
    let localValue = UserDefaults.standard.object(forKey: key)
    if let val = localValue as? String {
      return val
    } else {
      return nil
    }
  }

  // 同步存储UserDefaults数据
  @objc
	func setItemSync(_ key: String, value: String) -> NSNumber {
    if key.isEmpty || value.isEmpty {
		return NSNumber(value: false)
    }
    
    UserDefaults.standard.set(value, forKey: key)
    UserDefaults.standard.synchronize()
	return NSNumber(value: true)
  }

  // 同步删除UserDefaults数据
  @objc
  func removeItemSync(_ key: String) -> NSNumber {
    if key.isEmpty {
      return NSNumber(value: false)
    }

    UserDefaults.standard.removeObject(forKey: key)
    UserDefaults.standard.synchronize()
    return NSNumber(value: true)
  }

}
