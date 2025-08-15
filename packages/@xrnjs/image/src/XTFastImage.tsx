import FastImage, {
  ResizeMode,
  OnLoadEvent,
  OnProgressEvent,
  ImageStyle,
  Source,
  Priority,
} from "react-native-fast-image";
import React from "react";
import { NativeSyntheticEvent, StyleSheet, Platform } from "react-native";
import type { ImageRequireSource, StyleProp } from "react-native";
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";

import {
  ImageErrorEventData,
  ImageLoadEventData,
  ImageNativeProps,
  ImageProgressEventData,
  ImageSource,
} from "./Image.types";

//const NativeExpoImage = requireNativeViewManager<any>('XRNImageView');

function processColor(color) {
  return color;
}

export interface XTFastImageNativeProps
  extends Omit<ImageNativeProps, "source" | "placeholder"> {
  source?: Source | ImageRequireSource;
  placeholder?: ImageRequireSource;
}

class XTFastImage extends React.PureComponent<XTFastImageNativeProps> {
  onLoadStart = () => {
    this.props.onLoadStart?.();
  };

  onLoad = (event: OnLoadEvent) => {
    const source = this.props.source;
    let uri: string | undefined;
    if (typeof source === "number") {
      // 本地图片
      uri = resolveAssetSource(source)?.uri;
    } else {
      // 网络图片
      uri = source?.uri;
    }

    const expoEvent: ImageLoadEventData = {
      cacheType: "disk", // TODO
      source: {
        url: uri ?? "",
        width: event.nativeEvent.width,
        height: event.nativeEvent.height,
        mediaType: null, // TODO
      },
    };
    this.props.onLoad?.(expoEvent);
    this.onLoadEnd();
  };

  onProgress = (event: OnProgressEvent) => {
    const progressEvent: ImageProgressEventData = {
      loaded: event.nativeEvent.loaded,
      total: event.nativeEvent.total,
    };
    this.props.onProgress?.(progressEvent);
  };

  onError = () => {
    const error: ImageErrorEventData = {
      error: "harmony use fast-image, it has not detail error info!",
    };
    this.props.onError?.(error);
    this.onLoadEnd();
  };

  onLoadEnd = () => {
    this.props.onLoadEnd?.();
  };

  render() {
    const { style, accessibilityLabel, alt, ...props } = this.props;
    const resolvedStyle = StyleSheet.flatten(style);

    const fastImageStyle = resolvedStyle as StyleProp<ImageStyle>;
    // Shadows behave different on iOS, Android & Web.
    // Android uses the `elevation` prop, whereas iOS
    // and web use the regular `shadow...` props.
    if (Platform.OS === "android") {
      delete resolvedStyle.shadowColor;
      delete resolvedStyle.shadowOffset;
      delete resolvedStyle.shadowOpacity;
      delete resolvedStyle.shadowRadius;
    } else {
      // @ts-expect-error
      delete resolvedStyle.elevation;
    }

    // @ts-ignore
    const backgroundColor = processColor(resolvedStyle.backgroundColor);
    // On Android, we have to set the `backgroundColor` directly on the correct component.
    // So we have to remove it from styles. Otherwise, the background color won't take into consideration the border-radius.
    if (Platform.OS === "android") {
      delete resolvedStyle.backgroundColor;
    }

    const tintColor = processColor(props.tintColor || resolvedStyle.tintColor);

    const borderColor = processColor(resolvedStyle.borderColor);
    // @ts-ignore
    const borderStartColor = processColor(resolvedStyle.borderStartColor);
    // @ts-ignore
    const borderEndColor = processColor(resolvedStyle.borderEndColor);
    // @ts-ignore
    const borderLeftColor = processColor(resolvedStyle.borderLeftColor);
    // @ts-ignore
    const borderRightColor = processColor(resolvedStyle.borderRightColor);
    // @ts-ignore
    const borderTopColor = processColor(resolvedStyle.borderTopColor);
    // @ts-ignore
    const borderBottomColor = processColor(resolvedStyle.borderBottomColor);

    let resizeMode: ResizeMode | undefined = undefined;
    switch (this.props.contentFit) {
      case "contain":
        resizeMode = FastImage.resizeMode.contain;
        break;
      case "cover":
        resizeMode = FastImage.resizeMode.cover;
        break;
      case "fill":
        resizeMode = FastImage.resizeMode.stretch;
        break;
      case "none":
        resizeMode = FastImage.resizeMode.center;
        break;
      default:
        resizeMode = FastImage.resizeMode.cover; //cover为默认
        break;
    }

    return (
      <FastImage
        style={fastImageStyle}
        source={this.props.source}
        defaultSource={this.props.placeholder}
        resizeMode={resizeMode}
        tintColor={tintColor}
        onLoadStart={this.onLoadStart}
        onProgress={this.onProgress}
        onLoad={this.onLoad}
        onError={this.onError}
        onLoadEnd={this.onLoadEnd}
      />
    );
  }
}

export default XTFastImage;
