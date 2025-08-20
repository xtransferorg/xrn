import NavDestinationMgr from "../native/NavDestinationMgr"
import { GoBackActionHandler } from "./handler/GoBackActionHandler"
import { NavigateActionHandler } from "./handler/NavigateActionHandler"
import { PushActionHandler } from "./handler/PushActionHandler"
import { ReplaceActionHandler } from "./handler/RepalceActionHandler"
import { IActionHandler } from "./types/NativeTypes"
import { RNNavigationAction, RNNavigationActionType } from "./types/ReactNativeTypes"

class NavigationModuleInternal {
  private actionHandlerMap: Map<RNNavigationActionType, IActionHandler> = new Map()

  private initialHandlerIfNeeded() {
    if (this.actionHandlerMap.size > 0) {
      return
    }

    this.actionHandlerMap.set(RNNavigationActionType.NAVIGATE, new NavigateActionHandler())
    this.actionHandlerMap.set(RNNavigationActionType.REPLACE, new ReplaceActionHandler())
    this.actionHandlerMap.set(RNNavigationActionType.PUSH, new PushActionHandler())
    this.actionHandlerMap.set(RNNavigationActionType.GO_BACK, new GoBackActionHandler())
  }

  bindNavigationKey(key: string) {
    NavDestinationMgr.setTopRnId(key)
  }

  dispatchAction(jsonAction: string): boolean {
    const action = JSON.parse(jsonAction) as RNNavigationAction

    if (!action) {
      return false
    }

    this.initialHandlerIfNeeded()

    const handler = this.actionHandlerMap.get(action.type)

    if (!handler) {
      return false
    }

    return handler.handle(action)
  }
}

const NativeNavigationModule = new NavigationModuleInternal()

export default NativeNavigationModule