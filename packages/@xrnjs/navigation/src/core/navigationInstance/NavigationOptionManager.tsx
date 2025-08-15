import React from "react";
import { Image, I18nManager, TouchableOpacity, Platform } from "react-native";
import _ from "lodash";
import {
  MixedStackNavigationOptions,
  ParamListBase,
  RouteProp,
  StackNavigationOptions,
  StackNavigationProp,
} from "..";

import { goBack } from "../utils";

export type DynamicScreenOptions = {
  pageTitle?: string;
  gestureEnabled?: boolean;
  hideHeader?: boolean;
  hideLeft?: boolean;
  headerRight?: React.ReactNode;
  onBack?: (navigation: StackNavigationProp) => boolean;
} /* & Pick<StackNavigationOptions, 'headerRight'> */;

const realOptions = (
  route: RouteProp<ParamListBase>,
  navigation: StackNavigationProp,
  originalOptions?: MixedStackNavigationOptions
) => {
  let realOptions: StackNavigationOptions;

  if (typeof originalOptions === "object") {
    realOptions = originalOptions;
  } else if (typeof originalOptions === "function") {
    realOptions = originalOptions({ route, navigation });
  } else {
    realOptions = {};
  }

  return realOptions;
};

class NavigationOptionManager {
  static defaultNavigatorScreenOptions: StackNavigationOptions = {
    title: "",
    headerMode: "screen",
    headerTitleAlign: "center",
    // @ts-ignore
    animationEnabled: Platform.OS !== "harmony",
    gestureEnabled: true,
    headerStyle: {
      borderBottomWidth: 0,
      elevation: 0,
      shadowColor: "transparent",
    },
    headerTitleContainerStyle: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 32,
      paddingHorizontal: 0,
    },
    headerTitleStyle: {
      marginHorizontal: 0,
      paddingHorizontal: 0,
    },
    cardStyle: {
      opacity: 1,
    },
  };

  navigatorScreenOptions: MixedStackNavigationOptions | null = null;

  setNavigatorScreenOptions(options: MixedStackNavigationOptions) {
    this.navigatorScreenOptions = options;
  }

  getMergedNavigatorScreenOptions() {
    return Object.assign(
      {},
      NavigationOptionManager.defaultNavigatorScreenOptions,
      this.navigatorScreenOptions
    );
  }

  mergeScreenOptions(
    {
      route,
      navigation,
    }: {
      route: RouteProp<ParamListBase>;
      navigation: StackNavigationProp;
    },
    optionsInConfig?: MixedStackNavigationOptions,
    optionsInComponentStatic?: MixedStackNavigationOptions
  ): StackNavigationOptions {
    const dynamicScreenOptions = this.resolveDynamicScreenOptions(
      navigation,
      (route.params || {}) as DynamicScreenOptions
    );

    const realOptionsInComponentStatic = realOptions(
      route,
      navigation,
      optionsInComponentStatic
    );

    const realOptionsInConfig = realOptions(route, navigation, optionsInConfig);

    const mergedScreenOptions = _.assign(
      {},
      realOptionsInComponentStatic,
      realOptionsInConfig,
      _.omitBy(dynamicScreenOptions, _.isNil)
    );

    if (_.isNull(mergedScreenOptions.header)) {
      mergedScreenOptions.header = () => <></>;
    }

    return mergedScreenOptions;
  }

  resolveDynamicScreenOptions(
    navigation: StackNavigationProp,
    params: DynamicScreenOptions = {}
  ): StackNavigationOptions {
    const {
      pageTitle,
      gestureEnabled = true,
      hideHeader = false,
      hideLeft = false,
      headerRight,
      onBack: goBackFun,
    } = params;

    return {
      title: pageTitle,
      gestureEnabled,
      headerShown: !hideHeader,
      headerLeft: () => {
        if (hideLeft) {
          return null;
        }

        return (
          <TouchableOpacity
            accessibilityLabel="headerLeft"
            style={{
              height: 48,
              width: 48,
              padding: 12,
            }}
            onPress={async () => {
              if (!goBackFun || !goBackFun(navigation)) {
                goBack(navigation);
              }
            }}
          >
            <Image
              style={{
                height: 24,
                width: 24,
                resizeMode: "contain",
                transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
              }}
              source={require("../../../assets/back-icon.png")}
              fadeDuration={0}
            />
          </TouchableOpacity>
        );
      },
      headerRight: () => {
        return headerRight;
      },
    } as StackNavigationOptions;
  }
}

export default NavigationOptionManager;
