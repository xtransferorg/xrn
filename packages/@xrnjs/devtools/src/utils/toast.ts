import { Platform, ToastAndroid } from "react-native";
import { XRNNativeToast, DurationMode } from "@xrnjs/app-utils";

export function nativeToast(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid?.show(message, ToastAndroid.LONG);
  } else {
    XRNNativeToast?.showToast?.(message, DurationMode.LONG);
  }
}
