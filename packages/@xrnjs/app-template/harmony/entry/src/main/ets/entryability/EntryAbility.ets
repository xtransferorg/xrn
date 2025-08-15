import { XRNAbility } from 'xrn-multi-bundle';
import { window } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';
import { APP_SYS_NAVIGATION_HEIGHT, APP_SYS_SYSTEM_BAR_HEIGHT } from '../Constants';
import Want from '@ohos.app.ability.Want';

export default class EntryAbility extends XRNAbility {
  getPagePath() {
    return 'pages/Index';
  }
  onCreate(want: Want): void {
    super.onCreate(want);
    // errorManager.on("unhandledRejection", ohErrorMonitorInstance.bindRejectionCallback);
  }

  protected async onWindowStageSetup(windowStage: window.WindowStage) {
    windowStage.loadContent(this.getPagePath(), (err, data) => {
      if (err.code) {
        console.error("Failed to load the content", err.code)
        return;
      }
      let windowClass: window.Window = windowStage.getMainWindowSync();
      windowClass.setWindowLayoutFullScreen(true).then(() => {
        console.info('Succeeded in setting the window layout to full-screen mode.');
      }).catch((err: BusinessError) => {
        console.error('Failed to set the window layout to full-screen mode. Cause:' + JSON.stringify(err));
      });

      // 2. 获取布局避让遮挡的区域
      //系统状态栏
      let avoidArea = windowClass.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM);
      let topRectHeight = avoidArea.topRect.height; // 获取状态栏区域高度
      AppStorage.setOrCreate(APP_SYS_SYSTEM_BAR_HEIGHT, topRectHeight);

      //导航栏
      avoidArea = windowClass.getWindowAvoidArea(window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR);
      let bottomRectHeight = avoidArea.bottomRect.height; // 获取到导航条区域的高度
      AppStorage.setOrCreate(APP_SYS_NAVIGATION_HEIGHT, bottomRectHeight);

      // 3. 注册监听函数，动态获取避让区域数据
      windowClass.on('avoidAreaChange', (data) => {
        if (data.type === window.AvoidAreaType.TYPE_SYSTEM) {
          let topRectHeight = data.area.topRect.height;
          AppStorage.setOrCreate(APP_SYS_SYSTEM_BAR_HEIGHT, topRectHeight);
        } else if (data.type == window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR) {
          let bottomRectHeight = data.area.bottomRect.height;
          AppStorage.setOrCreate(APP_SYS_NAVIGATION_HEIGHT, bottomRectHeight);
        }
      });
      console.info("Succeeded in loading the content", JSON.stringify(data))
    });
  }

  onDestroy(): void {
    super.onDestroy()
  }
}
