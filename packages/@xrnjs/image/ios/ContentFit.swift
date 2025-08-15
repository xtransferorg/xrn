
extension ExpoImageContentFit {
  /**
   `ContentFit` cases can be directly translated to the native `UIView.ContentMode`
   except `scaleDown` that needs to be handled differently at the later step of rendering.
   */
  func toContentMode() -> UIView.ContentMode {
    switch self {
    case .contain:
      return .scaleAspectFit
    case .cover:
      return .scaleAspectFill
    case .fill:
      return .scaleToFill
    case .none, .scaleDown:
      return .center
    @unknown default:
      return .scaleAspectFill
    }
  }
}
