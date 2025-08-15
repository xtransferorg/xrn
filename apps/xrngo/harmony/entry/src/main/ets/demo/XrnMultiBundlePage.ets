import { XRNBundleModule } from 'xrn-bundle'
import { BundleInfo, BundleInfoManager, RN_INSTANCE_MANAGER } from 'xrn-multi-bundle'
import { router } from '@kit.ArkUI'
import { APP_SYS_NAVIGATION_HEIGHT, APP_SYS_SYSTEM_BAR_HEIGHT } from '../Constants'

@Entry
@Component
struct XrnMultiBundlePage {

  topHeight = AppStorage.get<number>(APP_SYS_SYSTEM_BAR_HEIGHT);
  bottomHeight = AppStorage.get<number>(APP_SYS_NAVIGATION_HEIGHT);

  bundleInfos: BundleInfo[] = BundleInfoManager.INSTANCE.BUNDLE_INFOS

  scroller: Scroller = new Scroller()

 getBundleInfos() {
   //  const result: BundleInfo[] = []
   //  this.bundleInfos.forEach((value) => {
   //    if (value.bundleName.includes('xrngo-multi-bundle')) {
   //      result.push(value)
   //    }
   //  })
   // return result
   return this.bundleInfos;
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

        Text('多Bundle展示页')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .margin({left: 20})
      }
      .width('100%')
      .height(56)
      .alignItems(VerticalAlign.Center)
      .backgroundColor('#FFFFFF')
      .justifyContent(FlexAlign.Start)
      Text('当前是原生页面').fontSize(14).fontColor(Color.Black)
      List({ initialIndex: 0}) {
        ForEach(this.getBundleInfos(), (info: BundleInfo, index: number) => {
          ListItem() {
            Column({space: 8}) {
              Text(`bundle-${index+1} 名称：${info?.bundleName}`)
              Text(`类型：${info?.bundleType === "main" ? "主Bundle" : "普通Bundle"}`)
              Text(`codePushKey：${info?.getCodePushKey()}`)
              Text(`JS文件名称：${info?.getJSBundleName()}`)
              Text(`本地服务链接：${info?.getLocalServerUrl()}`)
              Text(`本地服务端口：${info?.getLocalServerPort()}`)
            }.width('100%').padding(8).border({width: 1, color: $r('app.color.tintColor')}).alignItems(HorizontalAlign.Start)
            .onClick(() => {
              router.pushUrl({url: 'demo/XrnBundlePage', params: {bundleName: info?.bundleName, moduleName: info?.bundleName, initialProps: {}}})
            })
          }.padding(10)
        })
      }.width('100%').height('100%').padding({bottom: 40})
    }.width('100%').height('100%').padding({top: `${this.topHeight}px`, bottom: `${this.bottomHeight}px`})
  }
}

@Component
struct BundleItem {

  @Require
  bundleInfo: BundleInfo | undefined

  build() {
    Column() {
      Text(`名称：${this.bundleInfo?.bundleName}`)
      Text(`类型：${this.bundleInfo?.bundleType === "main" ? "主Bundle" : "普通Bundle"}`)
      Text(`codePushKey：${this.bundleInfo?.getCodePushKey()}`)
      Text(`JS文件名称：${this.bundleInfo?.getJSBundleName()}`)
      Text(`本地服务链接：${this.bundleInfo?.getLocalServerUrl()}`)
      Text(`本地服务端口：${this.bundleInfo?.getLocalServerPort()}`)
    }.width('100%').height('100%').border({width: 1, color: Color.Blue}).alignItems(HorizontalAlign.Start)
    .onClick(() => {
      router.pushUrl({url: 'demo/XrnBundlePage', params: {bundleName: this.bundleInfo?.bundleName, moduleName: this.bundleInfo?.bundleName, initialProps: {}}})
    })
  }
}