import { GlobalNavPathStack } from "../../native/NavHelper";
import { RNNavigationAction } from "../types/ReactNativeTypes";
import { BaseActionHandler } from "./base/BaseActionHandler";

export class GoBackActionHandler extends BaseActionHandler {
  handle(originAction: RNNavigationAction): boolean {
    if (GlobalNavPathStack.size() <= 1) {
      return false
    }

    const matchedState = this.getMatchedNavDestinationStateByRNId(originAction.source)

    if (!matchedState) return false

    GlobalNavPathStack.removeByNavDestinationId(matchedState.state.nativeId)

    return true;
  }
}