
import { LottieAnimation } from './LottieAnimation'

@Component
export struct LoadingProgressView {

  @Prop progressValue: number = 0

  // 必要时可以使用Blank组件作为占位组件，类似SwiftUI的Spacer
  build() {
    Column() {
      LottieAnimation({
        animationName: "loadingAnimation",
        animationRawFilePath: "loadingLottie.json"})
        .width(44)
        .height(44)
      if (this.progressValue > 0) {
        Progress({ value: this.progressValue, total: 100, type: ProgressType.Linear })
          .backgroundColor('rgba(210, 210, 210, 1)')
          .color('rgba(255, 123, 0, 1)')
          .width(180)
          .height(6)
          .borderRadius(3)
          .clip(true)
          .margin({top: 24})
      }
      Text("loading...")
        .fontSize(16)
        .margin({top: 16})
    }
    // .width('100%')
    // .height('100%')
  }

}