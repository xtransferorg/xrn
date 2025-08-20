import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { BackHandler, NativeEventEmitter, NativeModules } from "react-native";

import { withNavigation } from "./compatV4";
import {
  createStackNavigator,
  NavigationContainer,
  NavigationContainerProps,
  NavigationContainerRef,
  Navigation,
  NavigationState,
  StackRouteConfig,
} from "./core";
import { NavigationInterceptExtraData } from "./core/navigationInstance/NavigationInterceptorManager";
import { useNavigationContainerRefStack } from "./core/useNavigationContainerRefStack";
import { deepCloneInitialState } from "./core/utils";
import { NativeNavigationModule } from "./native";
import { LinkingConfig } from "./useLinking";

const Stack = createStackNavigator();

export type NavigationContainerWrapperProps = {
  routes: StackRouteConfig[];
  interceptExtraData?: NavigationInterceptExtraData;
  linking?: LinkingConfig;
} & Pick<NavigationContainerProps, "initialState" | "onStateChange">;

const NavigationContainerWrapperInner = <ParamList extends object>(
  {
    routes,
    initialState,
    onStateChange,
    interceptExtraData,
    // linking,
  }: NavigationContainerWrapperProps,
  ref?: React.Ref<NavigationContainerRef<ReactNavigation.RootParamList> | null>
) => {
  const { navigationRef, pushRefToStack } =
    useNavigationContainerRefStack<ParamList>();

  useImperativeHandle(ref, () => navigationRef.current);

  // const { enableLinking, initializeLinkingHandler } = useLinking(
  //   navigationRef,
  //   linking
  // );

  useEffect(() => {
    const handleBackEvent = () => {
      navigationRef.current?.goBack();
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackEvent);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleBackEvent);
  }, [navigationRef]);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules?.XRNNavigation);

    const listener = eventEmitter.addListener(
      "NATIVE_DISPATCH_ACTION",
      (action) => {
        const newAction = NativeNavigationModule.completeNativeAction(action);

        if (newAction.target !== navigationRef.getRootState().key) return;

        delete newAction.target;

        navigationRef.dispatch(newAction);
      }
    );

    return () => {
      listener.remove();
    };
  }, [navigationRef]);

  const bindNavigationKeyToNative = () => {
    NativeNavigationModule.setNavigationKey(navigationRef.getRootState().key);
  };

  const saveNavigationStateToNative = (_state?: NavigationState) => {
    // console.log('saveNavigationStateToNative', state);
    // NavigationModule.setNavigationState(state);
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={
        initialState ? deepCloneInitialState(initialState) : undefined
      }
      onReady={() => {
        pushRefToStack();
        bindNavigationKeyToNative();
        saveNavigationStateToNative(navigationRef.getRootState());
        // if (enableLinking) {
        //   initializeLinkingHandler();
        // }
      }}
      onStateChange={(state) => {
        onStateChange?.(state);
        saveNavigationStateToNative(state);
      }}
      onUnhandledAction={(action) => {
        console.log(
          "[XRN][Navigation] ",
          "NavigationContainer onUnhandledAction: ",
          action
        );
        NativeNavigationModule.dispatchAction(
          navigationRef.getRootState().key,
          action
        );
      }}
    >
      <Stack.Navigator
        detachInactiveScreens={false}
        screenOptions={() =>
          Navigation.navigationOptions.getMergedNavigatorScreenOptions()
        }
        intercept={(action, prevState, nextState) => {
          return Navigation.stackRouterInterceptor(
            action,
            prevState,
            nextState,
            interceptExtraData
          );
        }}
      >
        {routes?.map((item) => {
          // FIXME:  types
          const Com = withNavigation(item.component as any, true);

          return (
            <Stack.Screen
              key={item.path}
              name={item.path}
              component={Com as React.ComponentType}
              options={(props) =>
                Navigation.navigationOptions.mergeScreenOptions(
                  props,
                  item.navigationOptions,
                  item.component.navigationOptions
                )
              }
            />
          );
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const NavigationContainerWrapper = forwardRef(
  NavigationContainerWrapperInner
) as <RootParamList extends object = ReactNavigation.RootParamList>(
  props: NavigationContainerWrapperProps & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  }
) => React.ReactElement;
