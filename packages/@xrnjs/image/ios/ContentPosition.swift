
/**
 Represents a position value that might be either `Double` or `String`.
 */

//typealias ContentPositionValue = Either<Double, String>

/* 
 自定义 ContentPositionValue 对 Double 和 String 进行包装，
 理论上说，这里应该自定义泛型， 可以支持任意类型的Either<Type1, Type2>
 实际上：
 ContentPositionValue 本身还要导出给 Objective-C 使用，
 Objective-C 对泛型的支持，可以说是弱到渣，再加上Swift/OC 混编桥接问题，
 在这种情况下，依旧考虑对泛型支持纯属有点自找罪受。
 
 因此，这里的 ContentPositionValue 只是 Double, String 的2种类型进行包装的一种包装类型。
 
 所以，这里咱们直接把Expo Either的定义代码，拷贝过来改改凑合用用。
 */
/*
@objc(ExpoImageContentPositionValue)
class ContentPositionValue: NSObject {
  let value: Any?
  
  override init() {
    self.value = nil
    super.init()
  }
  
  @objc init(value: Any?) {
    self.value = value
    super.init()
  }
  
  public func `is`(_ type: Double) -> Bool {
    return value is Double
  }

  /**
   Returns a bool whether the value is of the second type.
   */
  public func `is`(_ type: String) -> Bool {
    return value is String
  }

  /**
   Returns the value as of the first type or `nil` if it's not of this type.
   */
  public func get() -> Double? {
    return value as? Double
  }

  /**
   Returns the value as of the second type or `nil` if it's not of this type.
   */
  public func get() -> String? {
    return value as? String
  }
  
}

/**
 Specifies the alignment of the image within the container's box.
 - Note: Its intention is to behave like the CSS [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) property.
 */
@objc(ExpoImageContentPosition)
class ContentPosition: NSObject {
  static let center = ContentPosition()

  @objc var top: ContentPositionValue?

  @objc var bottom: ContentPositionValue?

  @objc var right: ContentPositionValue?

  @objc var left: ContentPositionValue?

  /**
   Returns a horizontal content offset based on the `left` or `right` field.
   */
  func offsetX(contentWidth: Double, containerWidth: Double) -> Double {
    let diff = containerWidth - contentWidth

    if let leftDistance = distance(from: left) {
      return -diff / 2 + leftDistance
    }
    if let rightDistance = distance(from: right) {
      return diff / 2 - rightDistance
    }
    if let factor = factor(from: left) {
      return -diff / 2 + diff * factor
    }
    if let factor = factor(from: right) {
      return diff / 2 - diff * factor
    }
    return 0
  }

  /**
   Returns a vertical content offset based on the `top` or `bottom` field.
   */
  func offsetY(contentHeight: Double, containerHeight: Double) -> Double {
    let diff = containerHeight - contentHeight

    if let topDistance = distance(from: top) {
      return -diff / 2 + topDistance
    }
    if let bottomDistance = distance(from: bottom) {
      return diff / 2 - bottomDistance
    }
    if let factor = factor(from: top) {
      return -diff / 2 + diff * factor
    }
    if let factor = factor(from: bottom) {
      return diff / 2 - diff * factor
    }
    return 0
  }

  /**
   A `CGPoint` with horizontal and vertical content offsets.
   */
  func offset(contentSize: CGSize, containerSize: CGSize) -> CGPoint {
    return CGPoint(
      x: offsetX(contentWidth: contentSize.width, containerWidth: containerSize.width),
      y: offsetY(contentHeight: contentSize.height, containerHeight: containerSize.height)
    )
  }
}

/**
 Returns a static offset from the given position value or `nil` when it cannot be cast to a `Double`.
 */
private func distance(from value: ContentPositionValue?) -> Double? {
  if let value: Double = value?.get() {
    return value
  }
  if let value: String = value?.get() {
    return Double(value)
  }
  return nil
}

/**
 Returns a factor from the percentage value from the given position.
 The value must be a string containing a number and `%` character, or equal to `"center"` which is an equivalent to `50%`.
 */
private func factor(from value: ContentPositionValue?) -> Double? {
  guard let value: String = value?.get() else {
    return nil
  }
  if value == "center" {
    return 0.5
  }
  guard value.contains("%"), let percentage = Double(value.replacingOccurrences(of: "%", with: "")) else {
    return nil
  }
  return percentage / 100
}

*/
