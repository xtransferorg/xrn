import { Splash } from '../navDestination/Splash';
import { NavigationContainer, getModuleRouteParams, ModuleRouteParams } from 'xrn-navigation'
import webview from '@ohos.web.webview';
import { preferences } from "@kit.ArkData";
import { MainModuleContainer } from '../navDestination/MainModuleContainer';
import { BizModuleContainer } from '../navDestination/BizModuleContainer';
import { RN_INSTANCE_MANAGER } from 'xrn-multi-bundle';
import { FloatBall } from '../module/devtools/components/FloatBall'
import { RNInstance } from '@rnoh/react-native-openharmony';
import { BuildConfig } from '@react-native-oh-tpl/react-native-config/BuildConfig'
const DEV_ENV_NAME = "DEV_ENV_NAME"
const PROD = 'prod';

@Entry
@Component
struct MainPage {
  @State envName: string = BuildConfig.ENV_NAME
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
    Stack() {
      Column() {
        NavigationContainer({
          navDestination: this.SplashBuilder
        })
        Web({
          controller: this.controller,
          src: 'about:blank' // 加载空白页
        })
          .visibility(Visibility.Visible)// 隐藏组件
          .onPageBegin(() => {
            // 页面加载完成后获取 User-Agent
            let ua = this.controller.getUserAgent();
            console.log('WebView User-Agent:', ua, "this.dataPreferences", this.dataPreferences);
            this.dataPreferences?.putSync("xt-user-agent", ua)
            this.dataPreferences?.flush()
          })
          .width(1)
          .height(1)
      }

      if (this.envName !== PROD) {
        FloatBall({
          env: this.envName,
          onClickEvent: (): boolean => {
            const params = getModuleRouteParams() as ModuleRouteParams
            console.log('params',params)
            let bundleName = (params.bundleName || 'xrngo-main') as string
            console.log('bundleName',bundleName)
            let rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName) as RNInstance
            rnInstance?.emitDeviceEvent("NATIVE_FLOAT_BAR_CLICK", { params: { where: "NATIVE" } })
            return true
          },
        })
          .hitTestBehavior(HitTestMode.None)
          .width("100%")
          .height("100%")
      }
    }

    .width('100%')
    .height('100%')

  }
}