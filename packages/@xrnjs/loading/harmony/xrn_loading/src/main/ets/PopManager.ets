import { XTPromptHUD, XTHUDReactiveBaseOptions } from '@jxt/xt_hud'
import { LoadingProgressView } from './components/LoadingProgressView'
import window from '@ohos.window'

interface LoadingProgressModel {
  progress: number
}

@Builder
function progressHUDViewBuilder (progressModel: LoadingProgressModel) {
  Column() {
    LoadingProgressView({progressValue: progressModel.progress})
  }
}

export class PopManager {

  static showLoading(context: UIContext | null) {
    /// 重置全局配置
    XTPromptHUD.globalDestroyCustomHUD()
    XTPromptHUD.globalConfigCustomHUD(context, (options: XTHUDReactiveBaseOptions) => {
      options.isModal = true
      options.maskColor = Color.White
      options.closeOnPressBack = false
      options.closeOnClickOutside = false
      options.alignment = DialogAlignment.Center
      options.showInSubWindow = false
      options.keyboardAvoidMode = KeyboardAvoidMode.DEFAULT
      // options.offset = { dx: 0, dy: -100 }
      options.onPressBack = () => {
        //console.log('悬浮按钮回调系统返回事件')
      }
    })
    XTPromptHUD.showCustomHUD(wrapBuilder(progressHUDViewBuilder), {progress: 0})
  }

  static update(progress: number) {
    XTPromptHUD.updateCustomHUD<LoadingProgressModel>({progress: progress})
  }

  static hideLoading() {
    XTPromptHUD.hideCustomHUD()
  }
}