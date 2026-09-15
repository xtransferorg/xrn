import { GlobalNavPathStack, NavPath, replaceToMain } from "../../native/NavHelper";
import { RNNavigationAction } from "../types/ReactNativeTypes";
import { BaseActionHandler } from "./base/BaseActionHandler";

export class GoBackActionHandler extends BaseActionHandler {
  handle(originAction: RNNavigationAction): boolean {
    if (GlobalNavPathStack.size() <= 1) {
      if (this.isMainTop()) {
        return false
      }

      return replaceToMain()
    }

    const matchedState = this.getMatchedNavDestinationStateByRNId(originAction.source)

    if (!matchedState) return false

    GlobalNavPathStack.removeByNavDestinationId(matchedState.state.nativeId)

    return true;
  }

  private isMainTop(): boolean {
    const names = GlobalNavPathStack.getAllPathName()
    return names.length > 0 && names[names.length - 1] === NavPath.Main
  }
}
