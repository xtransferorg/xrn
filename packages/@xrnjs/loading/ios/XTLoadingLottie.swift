//
//  XTLoadingLottie.swift
//  xtapp
//
//  Created by  xtgq on 2024/8/29.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation
import UIKit
import Lottie

@objc public class XTLoadingLottie: NSObject {
  
  private var animationName = ""
  
  @objc public func addLottieAnimation(to view: UIView, withAnimationName name: String) {
    animationName = name
    view.addSubview(animationView)
    animationView.play()
  }
  
  @objc public func stopAnimation() {
    animationView.stop()
  }
  
  @objc public func removeAnimation() {
    animationView.removeFromSuperview()
  }
  
  private lazy var animationView: LottieAnimationView = {
    let bundleName = "XRNLoadingResources"
    let bundleURL = Bundle(for: Self.self).url(forResource: bundleName, withExtension: "bundle")
    let resourceBundle = bundleURL.flatMap { Bundle(url: $0) }
    let view = LottieAnimationView(name: animationName, bundle: resourceBundle ?? .main)
    view.frame = CGRect(x: -22, y: -60, width: 44, height: 44)
    view.loopMode = .loop
    view.contentMode = .scaleAspectFill
    return view
  }()
  
}
