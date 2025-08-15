import { CommonActions } from "@react-navigation/native";

import { NavigationAction, NavigationState } from "../core";
import { XRNNavigation } from "./XRNNavigation";
import { safeStringifyNavigationAction } from "../utils";

const GO_BACK_ACTION = CommonActions.goBack().type;

const ACTIONS_IGNORE_NATIVE_CHECKED: string[] = [GO_BACK_ACTION];

const setNavigationKey = (key: string) => {
  XRNNavigation.setNavigationKey(key);
};

const setNavigationState = (state?: NavigationState) => {
  // NativeNavigationModule.setNavigationState(JSON.stringify(state || {}));
};

const dispatchAction = (rootKey: string, action: NavigationAction) => {
  if (
    !ACTIONS_IGNORE_NATIVE_CHECKED.includes(action.type) &&
    isNativeAction(action)
  ) {
    return;
  }

  const newAction = Object.assign({}, action, { source: rootKey });

  const jsonAction = safeStringifyNavigationAction(newAction);

  XRNNavigation.dispatchAction(jsonAction);
};

const beforeAppCrash = () => {
  // NativeNavigationModule.beforeAppCrash();
};

const isNativeAction = (action: NavigationAction): boolean => {
  return action.source === "NATIVE";
};

const completeNativeAction = (jsonAction: string) => {
  const action = JSON.parse(jsonAction);

  action.source = "NATIVE";

  return action;
};

export default {
  setNavigationKey,
  setNavigationState,
  dispatchAction,
  beforeAppCrash,
  isNativeAction,
  completeNativeAction,
};
