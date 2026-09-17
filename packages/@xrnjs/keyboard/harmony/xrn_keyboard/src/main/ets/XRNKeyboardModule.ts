import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { SOFT_INPUT_MODE_PAN } from "./Constant"
import { KeyboardAvoidMode } from '@kit.ArkUI';
import { NATIVE_ID_KEYBOARD_CONTENT} from "./Constant"

export class XRNKeyboardModule extends TurboModule implements TM.XRNKeyboard.Spec {

  setKeyboard(reactTag: number, keyboardType: string, scrollTag: number, keyboardInfo: TM.XRNKeyboard.AmountInfo): Promise<boolean> {
    //暂不实现
    return Promise.resolve(false)
  }

  setSoftInputMode(mode: string): Promise<boolean> {
    // this.ctx.getUIContext()?.setKeyboardAvoidMode(mode)
    return Promise.resolve(false)
  }

  getKeyboardContentNativeID(): Promise<string> {
    return Promise.resolve(NATIVE_ID_KEYBOARD_CONTENT);
  }
}
