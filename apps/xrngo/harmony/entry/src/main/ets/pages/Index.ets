import { Splash } from '../navDestination/Splash';
import { NavigationContainer } from 'xrn-navigation'
import webview from '@ohos.web.webview';
import { preferences } from "@kit.ArkData";
import { MainModuleContainer } from '../navDestination/MainModuleContainer';
import { BizModuleContainer } from '../navDestination/BizModuleContainer';

@Entry
@Component
struct MainPage {
  dataPreferences: preferences.Preferences | null = null;
  controller: webview.WebviewController = new webview.WebviewController();

  aboutToAppear(): void {
    this.initPreferences()
  }

  private initPreferences() {
    if (this.dataPreferences == null) {
      const options: preferences.Options = { name: "nativeStore" };
      try {
        this.dataPreferences = preferences.getPreferencesSync(this.getUIContext().getHostContext(), options);
        console.log("Preferences 初始化成功");
      } catch (error) {
        console.error("Preferences 初始化失败:", error);
      }
    }
    console.log("this.dataPreferences?.")
    const ua = this.dataPreferences?.getSync("xt-user-agent", "")
    console.log('WebView.xt-user-agent', ua ? ua : "dddd")
  }

  @Builder
  SplashBuilder(name: string) {
    if (name === 'Splash') {
      Splash()
    } else if (name === 'Main') {
      MainModuleContainer()
    } else if (name === 'Biz') {
      BizModuleContainer()
    }
  }

  build() {
    Column() {
      NavigationContainer({
        navDestination: this.SplashBuilder
      })
      Web({
        controller: this.controller,
        src: 'about:blank' // 加载空白页
      })
        .visibility(Visibility.Hidden)// 隐藏组件
        .onPageBegin(() => {
          // 页面加载完成后获取 User-Agent
          let ua = this.controller.getUserAgent();
          console.log('WebView User-Agent:', ua, "this.dataPreferences", this.dataPreferences);
          this.dataPreferences?.putSync("xt-user-agent", ua)
          this.dataPreferences?.flush()
        }).width(1)
        .height(1)
    }
    .width('100%')
    .height('100%')
  }
}