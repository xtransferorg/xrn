// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage

#warning("这个枚举貌似是Native使用的，不涉及到bridge桥接的问题")
enum ImageCacheType: String {
  case none
  case disk
  case memory

  static func fromSdCacheType(_ sdImageCacheType: SDImageCacheType) -> ImageCacheType {
    switch sdImageCacheType {
    case .none:
      return .none
    case .disk, .all:
      return .disk
    case .memory:
      return .memory
    }
  }
}
