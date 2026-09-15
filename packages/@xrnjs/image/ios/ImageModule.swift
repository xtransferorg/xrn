//
//  ImageModule.swift
//  XrnExpoImage
//
//  Created by  xtgq on 2026/1/6.
//

import Foundation

import SDWebImage
import SDWebImageWebPCoder
import SDWebImageAVIFCoder
import SDWebImageSVGCoder

private var isloadXRNImage = false
private let loadXRNImageLockObject = NSObject()

public final class ImageModule: NSObject {
	
	public override init() {
		objc_sync_enter(loadXRNImageLockObject)
		if !isloadXRNImage {
			ImageModule.registerCoders()
			ImageModule.registerLoaders()
			isloadXRNImage = true
		}
		objc_sync_exit(loadXRNImageLockObject)
	}
	
	static func registerCoders() {
		SDImageCodersManager.shared.addCoder(SDImageAWebPCoder.shared)
		SDImageCodersManager.shared.addCoder(SDImageAVIFCoder.shared)
		SDImageCodersManager.shared.addCoder(SDImageSVGCoder.shared)
		SDImageCodersManager.shared.addCoder(SDImageHEICCoder.shared)
	}
	
	static func registerLoaders() {
		SDImageLoadersManager.shared.addLoader(BlurhashLoader())
		SDImageLoadersManager.shared.addLoader(ThumbhashLoader())
		SDImageLoadersManager.shared.addLoader(PhotoLibraryAssetLoader())
	}
	
}
