// Copyright 2022-present 650 Industries. All rights reserved.
/*
@objc(ExpoImageTransition)
class ImageTransition: NSObject {
  
  @objc var duration: Double = 100

  @objc var timing: ExpoImageTransitionTiming = .easeInOut

  @objc var effect: ExpoImageTransitionEffect = .crossDissolve

  func toAnimationOptions() -> UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }
}

extension ExpoImageTransitionTiming {
  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .easeInOut:
      return .curveEaseInOut
    case .easeIn:
      return .curveEaseIn
    case .easeOut:
      return .curveEaseOut
    case .linear:
      return .curveLinear
    @unknown default:
      return .curveEaseInOut
    }
  }
}

extension ExpoImageTransitionEffect {
  func toAnimationOption() -> UIView.AnimationOptions {
    switch self {
    case .crossDissolve:
      return .transitionCrossDissolve
    case .flipFromLeft:
      return .transitionFlipFromLeft
    case .flipFromRight:
      return .transitionFlipFromRight
    case .flipFromTop:
      return .transitionFlipFromTop
    case .flipFromBottom:
      return .transitionFlipFromBottom
    case .curlUp:
      return .transitionCurlUp
    case .curlDown:
      return .transitionCurlDown
    @unknown default:
      return .transitionCrossDissolve
    }
  }
}
*/
