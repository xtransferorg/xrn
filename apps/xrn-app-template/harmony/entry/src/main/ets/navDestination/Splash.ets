import { NavPath, replaceToMain } from "xrn-navigation"

@Component
export struct Splash {
  @Consume('navigation') navigation: NavPathStack

  aboutToAppear(): void {
    // 特殊场景处理
    if (this.navigation.getAllPathName().indexOf(NavPath.Main) >= 0) {
      this.navigation.popToName(NavPath.Main)
      return
    }
  }

  aboutToDisappear(): void {
    console.debug(`Splash.aboutToDisappear`)
  }

  build() {
    NavDestination() {
      RelativeContainer() {
        Image($r('app.media.ic_logo_bg')).onAppear(() => {
          setTimeout(() => {
            replaceToMain()
          }, 500)
        })
          .width(194)
          .height(122)
          .alignRules({middle: {anchor: '__container__', align: HorizontalAlign.Center}, center: {anchor: '__container__', align: VerticalAlign.Center}})
      }
      .width('100%')
      .height('100%')
    }
    .hideTitleBar(true)
    .hideToolBar(true)
  }
}

