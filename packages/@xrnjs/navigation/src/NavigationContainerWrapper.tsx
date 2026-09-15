import throttle from "lodash/throttle";
import { nanoid } from "nanoid";
import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { BackHandler, NativeEventEmitter, NativeModule } from "react-native";

import { withNavigation } from "./compatV4";
import {
  createStackNavigator,
  NavigationContainer,
  NavigationContainerProps,
  NavigationContainerRef,
  Navigation,
  NavigationState,
  StackRouteConfig,
  NavigationContainerRefWithCurrent,
} from "./core";
import { NavigationInterceptExtraData } from "./core/navigationInstance/NavigationInterceptorManager";
import { useNavigationContainerRefStack } from "./core/useNavigationContainerRefStack";
import { deepCloneInitialState } from "./core/utils";
import { NativeNavigationModule } from "./native";
import { XRNNavigation } from "./native/XRNNavigation";
import { LinkingConfig, useLinking } from "./useLinking";

const Stack = createStackNavigator();

const SAVE_NAVIGATION_STATE_THROTTLE_WAIT = 200;

export type NavigationContainerWrapperProps = {
  routes: StackRouteConfig[];
  interceptExtraData?: NavigationInterceptExtraData;
  linking?: LinkingConfig;
  onReady: (
    navigationRef: NavigationContainerRefWithCurrent<any>,
    key: string,
  ) => void;
} & Pick<NavigationContainerProps, "initialState" | "onStateChange">;

const NavigationContainerWrapperInner = <ParamList extends {}>(
  {
    routes,
    initialState,
    onStateChange,
    interceptExtraData,
    linking,
    onReady,
  }: NavigationContainerWrapperProps,
  ref?: React.Ref<NavigationContainerRef<ReactNavigation.RootParamList> | null>,
) => {
  const rootKeyRef = useRef<string>();
  if (!rootKeyRef.current) {
    rootKeyRef.current = "stack-" + nanoid(16);
    NativeNavigationModule.setNavigationKey(rootKeyRef.current);
  }
  const rootKey = rootKeyRef.current;

  const { navigationRef, pushRefToStack } =
    useNavigationContainerRefStack<ParamList>(rootKey);

  useImperativeHandle(ref, () => navigationRef.current);

  const { enableLinking, initializeLinkingHandler } = useLinking(
    navigationRef,
    linking,
  );

  useLayoutEffect(() => {
    const handleBackEvent = () => {
      navigationRef.current?.goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackEvent,
    );
    return () => subscription.remove();
  }, [navigationRef]);

  useLayoutEffect(() => {
    const eventEmitter = new NativeEventEmitter(
      XRNNavigation as unknown as NativeModule,
    );

    const listener = eventEmitter.addListener(
      "NATIVE_DISPATCH_ACTION",
      (action) => {
        const newAction = NativeNavigationModule.completeNativeAction(action);

        if (newAction.target !== rootKey) return;

        delete newAction.target;

        navigationRef.dispatch(newAction);
      },
    );

    return () => {
      listener.remove();
    };
  }, [navigationRef]);

  const saveNavigationStateToNativeRef =
    useRef<ReturnType<typeof throttle<(state?: NavigationState) => void>>>();
  if (!saveNavigationStateToNativeRef.current) {
    saveNavigationStateToNativeRef.current = throttle(
      (state?: NavigationState) => {
        NativeNavigationModule.setNavigationState(state);
      },
      SAVE_NAVIGATION_STATE_THROTTLE_WAIT,
    );
  }
  const saveNavigationStateToNative = saveNavigationStateToNativeRef.current;

  useLayoutEffect(() => {
    return () => {
      saveNavigationStateToNativeRef.current?.cancel();
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={
        initialState ? deepCloneInitialState(initialState) : undefined
      }
      onReady={() => {
        onReady?.(navigationRef, rootKey);
        saveNavigationStateToNative(navigationRef.getRootState());
        if (enableLinking) {
          initializeLinkingHandler();
        }
      }}
      onStateChange={(state) => {
        onStateChange?.(state);
        saveNavigationStateToNative(state);
      }}
      onUnhandledAction={(action) => {
        console.log(
          "[XRN][Navigation] ",
          "NavigationContainer onUnhandledAction: ",
          action,
        );
        saveNavigationStateToNative.flush();
        NativeNavigationModule.dispatchAction(rootKey, action);
      }}
    >
      <Stack.Navigator
        id={rootKey}
        detachInactiveScreens={false}
        screenOptions={() =>
          Navigation.navigationOptions.getMergedNavigatorScreenOptions()
        }
        intercept={(action, prevState, nextState) => {
          return Navigation.stackRouterInterceptor(
            action,
            prevState,
            nextState,
            interceptExtraData,
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
                  item.component.navigationOptions,
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
  NavigationContainerWrapperInner,
) as <RootParamList extends {} = ReactNavigation.RootParamList>(
  props: NavigationContainerWrapperProps & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  },
) => React.ReactElement;
