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
// const DEV_ENV_NAME = "DEV_ENV_NAME"
const DEV_ENV_NAME = "dev"
const PROD = 'prod';

@Entry
@Component
struct MainPage {
  // @State envName: string = BuildConfig.ENV_NAME

  aboutToAppear(): void {

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
      }

      // if (this.envName !== PROD) {
        FloatBall({
          env: DEV_ENV_NAME,
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
      // }
    }

    .width('100%')
    .height('100%')

  }
}