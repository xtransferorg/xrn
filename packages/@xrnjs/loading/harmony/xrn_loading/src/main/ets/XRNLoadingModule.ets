import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { PopManager } from './PopManager';
import {emitter} from '@kit.BasicServicesKit'


export class XRNLoadingModule extends TurboModule implements TM.XRNLoadingModule.Spec {
  show(): boolean {
    emitter.emit("XT_BUNDLE_LOADING_SHOW")
    return true
  }

  hide(): boolean {
    emitter.emit("XT_BUNDLE_LOADING_HIDE")
    return true
  }

  showLoading(): boolean {
    PopManager.showLoading(this.ctx.getUIContext())
    return true
  }

  updateProgress(value: number): boolean {
    PopManager.update(value)
    return true
  }

  hideLoading(): boolean {
    PopManager.hideLoading()
    return true
  }
}
