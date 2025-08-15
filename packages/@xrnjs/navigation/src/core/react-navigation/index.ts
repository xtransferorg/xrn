export * from '@react-navigation/native';
export * from '@react-navigation/stack';
export * from "@react-navigation/bottom-tabs";

// export type * from '@react-navigation/stack/lib/typescript/src/types';

export * as CommonActions from './CommonActions'

import type {
  ParamListBase,
  CommonNavigationAction,
  StackActionType,
  RouteProp,
  Route,
  NavigationProp,
  NavigationState,
} from '@react-navigation/native';

import type {
  StackNavigationOptions,
  StackNavigationProp as OriginalStackNavigationProp,
} from '@react-navigation/stack';

export type MixedStackAction = CommonNavigationAction | StackActionType;

export type MixedStackNavigationOptions =
  | StackNavigationOptions
  | ((props: {
      route: RouteProp<ParamListBase>;
      navigation: StackNavigationProp;
    }) => StackNavigationOptions);

export type NavigationPropType<
  ParamList extends ParamListBase = ParamListBase,
  PropType extends NavigationProp<ParamList> = NavigationProp<ParamList>,
> = Omit<PropType, 'getState'> & {
  navigate<RouteName extends keyof ParamList>(
    options: RouteName extends unknown
      ?
          | { key: string; params?: ParamList[RouteName]; merge?: boolean }
          | {
              routeName: RouteName;
              key?: string;
              params?: ParamList[RouteName];
              merge?: boolean;
            }
      : never
  ): void;

  getState(): NavigationState | undefined;
};

type Keyof<T extends {}> = Extract<keyof T, string>;

export type CompatNavigationProp<
  ParamList extends ParamListBase = ParamListBase,
  PropType extends NavigationPropType = NavigationPropType<ParamList>,
  RouteName extends keyof ParamList = Keyof<ParamList>,
> = PropType & {
  state: Route<Extract<RouteName, string>, ParamList[RouteName]> & {
    routeName: ParamList[RouteName];
  };

  /* getParam<T extends keyof ParamList[RouteName]>(
    paramName: T,
    defaultValue: NonNullable<ParamList[RouteName][T]>
  ): NonNullable<ParamList[RouteName][T]>;

  getParam<T extends keyof ParamList[RouteName]>(
    paramName: T
  ): ParamList[RouteName][T]; */

  getParam<T = any>(param: string, defaultValue?: T): T | undefined;

  isFirstRouteInParent(): boolean;
  /* dangerouslyGetParent<
    T = NavigationProp<ParamListBase> | undefined,
  >(): T extends NavigationProp<ParamListBase>
    ? CompatNavigationProp<T>
    : undefined; */
};

export type StackNavigationPropType = NavigationPropType<
  ParamListBase,
  OriginalStackNavigationProp<ParamListBase>
> & {
  replace<RouteName extends keyof ParamListBase>(options: {
    routeName: RouteName;
    params?: ParamListBase[RouteName];
  }): void;

  push<RouteName extends keyof ParamListBase>(options: {
    routeName: RouteName;
    params?: ParamListBase[RouteName];
  }): void;
};

export type StackNavigationProp<
  ParamList extends {} = {},
  RouteName extends keyof ParamList = Keyof<ParamList>,
> = CompatNavigationProp<ParamList, StackNavigationPropType, RouteName>;

export type NavigationInjectedComponentProps<
  NavigationProp extends CompatNavigationProp,
> =
  | React.ComponentType<{
      route: RouteProp<ParamListBase>;
      navigation: NavigationProp;
    }>
  | React.ComponentType<any>;

export type NavigationScreenComponentType<
  NavigationProp extends CompatNavigationProp,
> = NavigationInjectedComponentProps<NavigationProp> & {
  navigationOptions?: MixedStackNavigationOptions;
};

export type StackRouteConfig = {
  path: string;
  component: NavigationScreenComponentType<StackNavigationProp>;
  navigationOptions?: StackNavigationOptions
};
