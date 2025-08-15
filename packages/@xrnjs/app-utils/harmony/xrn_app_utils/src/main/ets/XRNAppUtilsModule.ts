import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { bundleManager, common, Want } from '@kit.AbilityKit';
import { safetyDetect } from '@kit.DeviceSecurityKit';
import { BusinessError } from '@ohos.base';
import { JSON } from '@kit.ArkTS';
import window from '@ohos.window'
export class XRNAppUtilsModule extends TurboModule implements TM.XRNAppUtilsModule.Spec {

  protected context: common.UIAbilityContext;

  constructor(ctx) {
    super(ctx);
    this.context = ctx?.uiAbilityContext;
  }

  checkSysIntegrity(nonce: string): Promise<TM.XRNAppUtilsModule.CheckSysIntegrityResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const data: safetyDetect.SysIntegrityResponse = await safetyDetect.checkSysIntegrity({nonce})
        console.log("checkSysIntegrity:result", data.result);
        resolve(data)
      } catch (e) {
        console.log('checkSysIntegrity:error', e)
        reject(e)
      }
    })
  }

  launchAppDetail(pkgName: string, marketPgkName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const want: Want = {
        uri: `store://appgallery.huawei.com/app/detail?id=${pkgName}`
      };
      this.context.startAbility(want).then(() => {
        console.log(`${XRNAppUtilsModule.NAME}.launchAppDetail:success`)
        resolve()
      }).catch((e) => {
        console.log(`${XRNAppUtilsModule.NAME}.launchAppDetail:fail, pkgName=${pkgName}, marketPgkName=${marketPgkName}, error=${JSON.stringify(e)}`);
        reject(JSON.stringify(e));
      });
    })
  }

  async isAppRooted(): Promise<boolean> {
    //需要在AppGallery中开通Device Security服务；
    return new Promise(async (resolve, reject) => {
      try {
        const random = `${Math.random()}`
        // const data: safetyDetect.SysIntegrityResponse = await safetyDetect.checkSysIntegrity({nonce: random})
        // console.log(`data=${data}`)
        resolve(false)
      } catch (e) {
        reject({code: e.code, message: e.message});
      }
    });
  }

  installApp(filePath: string): void {

    // let want = {
    //   bundleName: 'com.example.appinstaller',
    //   abilityName: 'com.example.appinstaller.MainAbility',
    //   parameters: {
    //     installFilePath: filePath
    //   }
    // };
    //
    // ab

    // abilityFeatureAbility.startAbility(want)
    //   .then(() => console.info('Jump to install page'))
    //   .catch((err) => console.error(`Failed to start install: ${JSON.stringify(err)}`));

    let want = {
      action: 'ohos.want.action.VIEW',
      uri: filePath, // HAP 包路径 file:///storage/emulated/0/Download/example.hap
      type: 'application/vnd.ohos.hap'
    };

    this.context.startAbility(want)
      .then(() => {
        console.info('成功启动安装界面');
      })
      .catch((err) => {
        console.error('启动安装失败:', err);
      });
  }

  isAppInstalled(pkgName: string): boolean {
    try {
      const result = bundleManager.canOpenLink(pkgName);
      return result;
    } catch (e) {
      console.log(`e=${JSON.stringify(e)}`)
      return false;
    }
  }

  exitApp(): void {
    this.context.terminateSelf(null);
    this.context.getApplicationContext().killAllProcesses();
  }

  relaunchApp(): void {
    const bundleInfo = bundleManager.getBundleInfoForSelfSync(bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_HAP_MODULE);
    let want: Want = {
      bundleName: bundleInfo.name,
      abilityName: bundleInfo.hapModulesInfo[0].mainElementName
    };
    this.context.getApplicationContext().restartApp(want)
  }

  moveTaskToBack(): void {
    window.getLastWindow(this.context).then((value) => {
      value.minimize((err: BusinessError) => {
        const errCode: number = err.code;
        if (errCode) {
          console.error('Failed to minimize the window. Cause: ' + JSON.stringify(err));
          return;
        }
        console.info('Succeeded in minimizing the window.');
      });
      console.info('Succeeded in obtaining the top window. Data: ' + JSON.stringify(value));
    })
  };

  isGooglePlayStoreInstalled(): Promise<boolean> {
    //这里需要传入 scheme，并在querySchemes中指定，目前没有
    // return new Promise((resolve, reject) => {
    //   let  result = false;
    //   try {
    //     result = bundleManager.canOpenLink("")
    //   } catch (e) {
    //     result = false;
    //   }
    //   resolve(result)
    // })

    return new Promise((resolve, reject) => {
      resolve(false)
    })
  }
}
