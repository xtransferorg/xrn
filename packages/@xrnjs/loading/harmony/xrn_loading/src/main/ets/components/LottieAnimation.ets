import lottie, { AnimationItem } from '@ohos/lottie'
import { buffer, JSON } from '@kit.ArkTS';

@Component
export struct LottieAnimation {
  private renderingSettings: RenderingContextSettings = new RenderingContextSettings(true);
  private canvasRenderingContext: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.renderingSettings);
  private animateItem: AnimationItem | null = null;

  // 动画名称
  @Prop animationName: string;
  //非 Raw Path 的 Lottie JSON 路径
  @Prop animationPath?: string;
  // Raw Path 的 Lottie JSON 路径
  @Prop animationRawFilePath?: string //
  @Prop autoplay: boolean = false; // 是否自动播放
  @Prop loop: boolean = true; // 是否循环播放
  // 支持填充模式：Fill, Top, Cover, Bottom, Contain  默认模式是：Contain
  @Prop contentMode: string = "Contain"; // 是否循环播放

  // 加载动画
  loadAnimation() {

    let lottieData: Object | null = null
    if (!!this.animationRawFilePath) {
      try {
        const data: Uint8Array = getContext(this).resourceManager.getRawFileContentSync(this.animationRawFilePath);
        const jsonStr = buffer.from(data.buffer).toString();
        lottieData = JSON.parse(jsonStr);
      } catch (e) {
        console.log("lottie json load error: ", e);
      }
    }

    this.animateItem = lottie.loadAnimation({
      container: this.canvasRenderingContext,
      renderer: 'canvas', // 采用 Canvas 渲染模式
      loop: this.loop,
      autoplay: this.autoplay, // 如果配置了自动播放，DOMLoaded也可以不用监听，主动触发this.animateItem?.play()
      name: this.animationName,
      contentMode: this.contentMode,
      path: this.animationPath,
      animationData: lottieData,
    });

    this.animateItem?.addEventListener('DOMLoaded', () => {
      this.animateItem?.play();
    });
  }

  // destory 析构没了，用这个aboutToDisappear代替
  // 销毁动画
  aboutToDisappear(): void {
    this.animateItem?.removeEventListener("DOMLoaded");
    lottie.destroy(this.animationName);
    this.animateItem = null;
  }

  build() {
    Canvas(this.canvasRenderingContext)
      // .width('100%')
      // .height('100%')
      .onReady(() => {
        if (this.animateItem != null) {
          // 可在此生命回调周期中加载动画，可以保证动画尺寸正确
          this.animateItem?.resize();
        } else {
          this.canvasRenderingContext.imageSmoothingEnabled = true;
          this.canvasRenderingContext.imageSmoothingQuality = 'medium';
          this.loadAnimation();
        }
      });
  }
}