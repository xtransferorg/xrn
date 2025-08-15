// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage

extension ExpoImageCachePolicy {
  func toSdCacheType() -> SDImageCacheType {
    switch self {
    case .none:
      return .none
    case .disk:
      return .disk
    case .memory:
      return .memory
    case .memoryAndDisk:
      return .all
    @unknown default:
      return .disk
    }
  }
}
