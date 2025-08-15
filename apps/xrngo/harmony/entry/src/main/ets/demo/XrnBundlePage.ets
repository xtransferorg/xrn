import { BundleState, RNContainer, RN_INSTANCE_MANAGER } from 'xrn-multi-bundle'
import { router } from '@kit.ArkUI';
import { APP_SYS_NAVIGATION_HEIGHT, APP_SYS_SYSTEM_BAR_HEIGHT } from '../Constants';
import { LifecycleState } from '@rnoh/react-native-openharmony';

interface GeneratedTypeLiteralInterface_1 {
  bundleName: string;
  moduleName: string;
}

@Entry
@Component
struct XrnBundlePage {

  topHeight = AppStorage.get<number>(APP_SYS_SYSTEM_BAR_HEIGHT);
  bottomHeight = AppStorage.get<number>(APP_SYS_NAVIGATION_HEIGHT);

  bundleName: string = '';
  moduleName: string = '';

  @State
  bundleDesc: string = '当前Bundle数据是：'

  getBundleInfoDesc(): string {
    const bundleDes = RN_INSTANCE_MANAGER.getBundleDesc(this.bundleName)
    return `当前Bundle数据是：bundleState=${BundleState[bundleDes.bundleState]},   id=${bundleDes.rnInstanceId},   lifecyelState=${LifecycleState[bundleDes.rnInstanceLifecycleState]},   jsBundleProviderUrl=${bundleDes.jsBundleProviderUrl}, surfaceHandleCount=${bundleDes.surfaceHandleCount}`
  }

  reloadBundle(): void {
    RN_INSTANCE_MANAGER.reCreateRNInstance(this.bundleName);
  }

  aboutToAppear(): void {
    const params = router.getParams() as GeneratedTypeLiteralInterface_1;
    this.bundleName = params.moduleName;
    this.moduleName = params.moduleName;
  }

  jumpBundlePage(bundleName: string, moduleName: string) {
    router.pushUrl({url: 'demo/XrnBundlePage', params: {bundleName: bundleName, moduleName: moduleName, initialProps: {}}})
  }

  build() {
    Column({space: 10}) {
      Row() {
        Image($r('app.media.ic_back'))
          .width(20)
          .height(20)
          .margin({ left: 14 })
          .onClick(() => {
            router.back()
          })

        Text(`${this.bundleName}`)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .margin({left: 20})
      }
      .width('100%')
      .height(56)
      .alignItems(VerticalAlign.Center)
      .backgroundColor('#FFFFFF')
      .justifyContent(FlexAlign.Start)
      Text(`${this.bundleDesc}`).fontSize(14).fontColor(Color.Black).padding(2)
      Scroll() {
        Row() {
          Button('获取Bundle数据').onClick(() => {
            this.bundleDesc = this.getBundleInfoDesc()
          }).backgroundColor($r('app.color.tintColor'))
          Button('Reload').onClick(() => {
            this.reloadBundle();
          }).backgroundColor($r('app.color.tintColor'))
          Button('Bundle-1').backgroundColor($r('app.color.tintColor')).onClick(() => {
            this.jumpBundlePage("xrngo-multi-bundle-1", "xrngo-multi-bundle-1")
          })
          Button('Bundle-2').backgroundColor($r('app.color.tintColor')).onClick(() => {
            this.jumpBundlePage("xrngo-multi-bundle-2", "xrngo-multi-bundle-2")
          })
          Button('Bundle-3').backgroundColor($r('app.color.tintColor')).onClick(() => {
            this.jumpBundlePage("xrngo-multi-bundle-3", "xrngo-multi-bundle-3")
          })
        }.height(30)
      }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)

      Stack() {
        RNContainer({ bundleName: this.bundleName, moduleName: this.moduleName, initialProps: {} })
      }.width('100%').height('100%').padding(2).backgroundColor(Color.Orange)
    }.padding({top: `${this.topHeight}px`, bottom: `${this.bottomHeight}px`})
  }
}