import { TurboModule } from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import common from "@ohos.app.ability.common";
import { BusinessError } from "@kit.BasicServicesKit";
import { preferences } from "@kit.ArkData";

// 保证同一个js引擎环境内，preferences实例只初始化一次
let dataPreferences: preferences.Preferences | null = null;

export class XRNNativeStorageModule
  extends TurboModule
  implements TM.XRNNativeStorageModule.Spec
{
  protected context: common.UIAbilityContext;

  constructor(ctx) {
    super(ctx);
    this.context = ctx?.uiAbilityContext;
    this.initPreferences();
  }

  // 初始化 Preferences 实例对象
  private initPreferences() {
    if (dataPreferences === null) {
      const options: preferences.Options = { name: "nativeStore" };
      try {
        dataPreferences = preferences.getPreferencesSync(this.context, options);
        console.log("Preferences 初始化成功");
      } catch (error) {
        console.error("Preferences 初始化失败:", error);
      }
    }
  }

  getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const value: preferences.ValueType = dataPreferences?.getSync(key, "");
        if (value && typeof value === "string") {
          resolve(value);
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  setItem(key: string, value: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        dataPreferences?.putSync(key, value);
        // 持久化数据
        dataPreferences
          ?.flush()
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  removeItem(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        dataPreferences?.deleteSync(key);
        // 持久化操作
        dataPreferences
          ?.flush()
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  getItemSync(key: string): string | null {
    try {
      const value: preferences.ValueType = dataPreferences?.getSync(key, "");
      if (value && typeof value === "string") {
        return value;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  setItemSync(key: string, value: string): boolean {
    try {
      dataPreferences?.putSync(key, value);
      dataPreferences
        ?.flush()
        .then(() => {
          console.info("持久化成功");
        })
        .catch(() => {
          console.error("持久化失败");
        });
      return true;
    } catch (error) {
      return false;
    }
  }

  removeItemSync(key: string): boolean {
    try {
      dataPreferences?.deleteSync(key);
      dataPreferences
        .flush()
        .then(() => {
          console.info("持久化成功");
        })
        .catch(() => {
          console.error("持久化失败");
        });
      return true;
    } catch (error) {
      return false;
    }
  }
  
}
