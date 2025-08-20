import { NativeModules, Platform } from "react-native";
import { InitialState } from "../react-navigation";
import { finishBundle } from "../../native/NavigationModule";

export const goBack = (navigation?: { goBack: () => void } | null) => {
  if (Platform.OS === "ios") {
    // Page页面侧滑被禁止时，点击返回按钮返回上一级页面时，需要重置侧滑手势状态
    NativeModules.BundleNavigation.gestureEnabled(true);
  }

  if (navigation) {
    navigation.goBack();
  } else {
    finishBundle();
  }
};

export const deepCloneInitialState = (
  originState: InitialState
): InitialState => {
  const state = {
    type: originState.type,
    index: originState.index,
    routes: originState.routes?.map((item) => ({
      name: item.name,
      ...(item.params ? { params: item.params } : {}),
      ...(item.state ? { state: deepCloneInitialState(item.state) } : {}),
    })),
  };

  return state;
};
