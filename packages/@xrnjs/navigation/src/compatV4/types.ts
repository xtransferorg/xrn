import {
  CompatNavigationProp,
  MixedStackNavigationOptions,
  NavigationState,
  ParamListBase,
  Route,
} from '../core';

/**
 *
 * @deprecated
 */
type DEPRECATED = {};

/**
 *
 * @deprecated
 */
export type NavigationContainerComponent = DEPRECATED;

/**
 *
 * @deprecated
 */
export type NavigationScreenComponent = React.ComponentType<any> & {
  navigationOptions?: MixedStackNavigationOptions;
};

/**
 *
 * @deprecated
 */
export type NavigationRoute<
  RouteName extends string,
  Params extends object | undefined = object | undefined,
> = Route<RouteName, Params>;

/**
 *
 *
 * @deprecated use CompatNavigationProp instead
 */
export type NavigationParams = Record<string, any>;

/**
 *
 * @deprecated use CompatNavigationProp instead
 */
export type NavigationScreenProp<
  State extends NavigationState | null | unknown = NavigationState<Record<string, any>>,
  ParamList extends ParamListBase | any = any,
> = { __state?: State; __paramList?: ParamList } & CompatNavigationProp<
  ParamList extends ParamListBase ? ParamList : ParamListBase
>;

/**
 *
 * @deprecated
 */
export type NavigationInjectedProps<
  ParamList extends ParamListBase = ParamListBase,
> = {
  __paramList?: ParamList;
  navigation: CompatNavigationProp<ParamList>;
};
