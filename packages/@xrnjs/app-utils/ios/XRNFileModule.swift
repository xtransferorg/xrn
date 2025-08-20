//
//  XRNFileModule.swift
//  xtapp
//
//  Created by  xtgq on 2025/5/8.
//  Copyright © 2025 Facebook. All rights reserved.
//

import Foundation

@objc(XRNFileModule)
class XRNFileModule: NSObject {

    @objc(clearFrescoCache:withRejecter:)
    func clearFrescoCache(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        resolve(NSNumber(value: false))
    }
	
	@objc(insertImageToPhotoLibrary:fileName:withResolver:withRejecter:)
	  func insertImageToPhotoLibrary(_ path: String, fileName: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		  resolve(NSNumber(value: false))
	}
  
}
