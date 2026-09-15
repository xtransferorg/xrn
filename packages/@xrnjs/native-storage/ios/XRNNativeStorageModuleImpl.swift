//
//  XRNNativeStorageModuleImpl.swift
//  react-native-xrn-native-storage
//
//  Created by  xtgq on 2025/12/25.
//

import Foundation
import React

@objc(XRNNativeStorageModuleImpl)
public class XRNNativeStorageModuleImpl: NSObject {

	@objc public func getItem(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
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
	
	@objc public func setItem(_ key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		if key.isEmpty || value.isEmpty {
			resolve(false)
			return
		}
		UserDefaults.standard.set(value, forKey: key)
		UserDefaults.standard.synchronize()
		resolve(true)
	}
	
	@objc public func removeItem(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		if key.isEmpty {
			resolve(false)
			return
		}
		UserDefaults.standard.removeObject(forKey: key)
		UserDefaults.standard.synchronize()
		resolve(true)
	}
	
	@objc public func getItemSync(_ key: String) -> String? {
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

	@objc public func setItemSync(_ key: String, value: String) -> NSNumber {
		if key.isEmpty || value.isEmpty {
			return NSNumber(value: false)
		}
		UserDefaults.standard.set(value, forKey: key)
		UserDefaults.standard.synchronize()
		return NSNumber(value: true)
	}

	@objc public func removeItemSync(_ key: String) -> NSNumber {
		if key.isEmpty {
			return NSNumber(value: false)
		}
		UserDefaults.standard.removeObject(forKey: key)
		UserDefaults.standard.synchronize()
		return NSNumber(value: true)
	}
}
