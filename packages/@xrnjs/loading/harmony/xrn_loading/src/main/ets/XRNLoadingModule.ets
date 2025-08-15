import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { PopManager } from './PopManager';
import {emitter} from '@kit.BasicServicesKit'


export class XRNLoadingModule extends TurboModule implements TM.XRNLoadingModule.Spec {
  show(): void {
    emitter.emit("XT_BUNDLE_LOADING_SHOW")
  }

  hide(): void {
    emitter.emit("XT_BUNDLE_LOADING_HIDE")
  }

  showLoading(): void {
    PopManager.showLoading(this.ctx.getUIContext())
  }

  updateProgress(value: number) {
    PopManager.update(value)
  }

  hideLoading(): void {
    PopManager.hideLoading()
  }
}
