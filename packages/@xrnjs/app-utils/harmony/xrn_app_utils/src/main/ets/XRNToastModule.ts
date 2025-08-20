import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { promptAction } from '@kit.ArkUI';

export class XRNToastModule extends TurboModule implements TM.XRNToastModule.Spec {

  showToast(message: string, duration: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      promptAction.showToast({
        message: message,
        duration: duration === "LONG" ? 5000 : 3000,
        showMode: promptAction.ToastShowMode.DEFAULT,
        alignment: Alignment.Center
      });
      resolve(true);
    });
  }

  hideToast(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }
}
