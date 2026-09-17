// DemoInitializer 已移除对 @xrnjs/startup 的依赖（该包在 opensource 重构后不再安装）
// 如需恢复启动初始化器，请重新引入 @xrnjs/startup 依赖并恢复 Initializer 接口实现。

export class DemoInitializer {
  initializeOptions: Record<string, unknown> | undefined = {
    "userConfirmationRequired": true
  }

  create(): void {
    console.log("DemoInitializer create...")
  }
}
