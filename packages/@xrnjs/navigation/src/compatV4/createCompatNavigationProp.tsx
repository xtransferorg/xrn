import warnOnce from 'warn-once';

import {
  NavigationState,
  NavigationProp,
  ParamListBase,
  PartialState,
  RouteProp,
  CompatNavigationProp,
  NavigationPropType,
} from '../core';

import * as helpers from './helpers';

type EventName =
  | 'action'
  | 'willFocus'
  | 'willBlur'
  | 'didFocus'
  | 'didBlur'
  | 'refocus';

export default function createCompatNavigationProp<
  OriginalNavigationPropType extends NavigationPropType,
  ParamList extends
    ParamListBase = OriginalNavigationPropType extends NavigationProp<
    infer P,
    any,
    any,
    any,
    any
  >
    ? P
    : ParamListBase,
>(
  navigation: OriginalNavigationPropType,
  state:
    | (RouteProp<ParamList, keyof ParamList> & {
        state?: NavigationState | PartialState<NavigationState>;
      })
    | NavigationState
    | PartialState<NavigationState>,
  context: Record<string, any>,
  isFirstRouteInParent?: boolean
): CompatNavigationProp<ParamList, OriginalNavigationPropType> {
  context.parent = context.parent || {};
  context.subscriptions = context.subscriptions || {
    didFocus: new Map<() => void, () => void>(),
    didBlur: new Map<() => void, () => void>(),
    refocus: new Map<() => void, () => void>(),
  };

  return {
    ...navigation,
    original: navigation,
    ...Object.entries(helpers).reduce<{
      [key: string]: (...args: any[]) => void;
    }>((acc, [name, method]: [string, Function]) => {
      if (name in navigation) {
        acc[name] = (...args: any[]) => navigation.dispatch(method(...args));
      }

      return acc;
    }, {}),
    addListener(type: EventName, callback: () => void) {
      let unsubscribe: () => void;

      switch (type) {
        case 'willFocus':
          unsubscribe = navigation.addListener('focus', callback);
          break;
        case 'willBlur':
          unsubscribe = navigation.addListener('blur', callback);
          break;
        case 'didFocus': {
          const listener = () => {
            if (navigation.isFocused()) {
              callback();
            }
          };

          // @ts-expect-error: this event may not exist in this navigator
          unsubscribe = navigation.addListener('transitionEnd', listener);
          context.subscriptions.didFocus.set(callback, unsubscribe);
          break;
        }
        case 'didBlur': {
          const listener = () => {
            if (!navigation.isFocused()) {
              callback();
            }
          };

          // @ts-expect-error: this event may not exist in this navigator
          unsubscribe = navigation.addListener('transitionEnd', listener);
          context.subscriptions.didBlur.set(callback, unsubscribe);
          break;
        }
        case 'refocus': {
          const listener = () => {
            if (navigation.isFocused()) {
              callback();
            }
          };

          // @ts-expect-error: this event may not exist in this navigator
          unsubscribe = navigation.addListener('tabPress', listener);
          context.subscriptions.refocus.set(callback, unsubscribe);
          break;
        }
        case 'action':
          warnOnce(true, "Listening to 'action' events is not supported.");
          unsubscribe = () => {};
          break;
        default:
          unsubscribe = navigation.addListener(type, callback);
      }

      const subscription = () => unsubscribe();

      subscription.remove = unsubscribe;

      return subscription;
    },
    removeListener(type: EventName, callback: () => void) {
      context.subscriptions = context.subscriptions || {};

      switch (type) {
        case 'willFocus':
          navigation.removeListener('focus', callback);
          break;
        case 'willBlur':
          navigation.removeListener('blur', callback);
          break;
        case 'didFocus': {
          const unsubscribe = context.subscriptions.didFocus.get(callback);
          unsubscribe?.();
          break;
        }
        case 'didBlur': {
          const unsubscribe = context.subscriptions.didBlur.get(callback);
          unsubscribe?.();
          break;
        }
        case 'refocus': {
          const unsubscribe = context.subscriptions.refocus.get(callback);
          unsubscribe?.();
          break;
        }
        case 'action':
          warnOnce(true, "Listening to 'action' events is not supported.");
          break;
        default:
          navigation.removeListener(type, callback);
      }
    },
    state: {
      key: state.key,
      // @ts-expect-error
      name: state.name,
      // @ts-expect-error
      params: state.params ?? {},
      get index() {
        // @ts-expect-error
        if (state.index !== undefined) {
          // @ts-expect-error
          return state.index;
        }

        console.warn(
          "Looks like you are using 'navigation.state.index' in your code. Accessing child navigation state for a route is not safe and won't work correctly. You should refactor it not to access the 'index' property in the child navigation state."
        );

        // @ts-expect-error
        return state.state?.index;
      },
      get routes() {
        // @ts-expect-error
        if (state.routes !== undefined) {
          // @ts-expect-error
          return state.routes;
        }

        console.warn(
          "Looks like you are using 'navigation.state.routes' in your code. Accessing child navigation state for a route is not safe and won't work correctly. You should refactor it not to access the 'routes' property in the child navigation state."
        );

        // @ts-expect-error
        return state.state?.routes;
      },
    },
    getParam<T = any>(paramName: string, defaultValue?: T): T | undefined {
      // @ts-expect-error
      const params = state.params;

      if (params && paramName in params) {
        return params[paramName];
      }

      return defaultValue;
    },
    isFirstRouteInParent(): boolean {
      if (typeof isFirstRouteInParent === 'boolean') {
        return isFirstRouteInParent;
      }

      const { routes } = navigation.getState() || {};

      return Array.isArray(routes) && routes[0]?.key === state.key;
    },
    /*  dangerouslyGetParent() {
      const parent =
        'getParent' in navigation ? navigation.getParent() : undefined;

      const state =
        'getState' in navigation ? navigation.getState() : undefined;

      if (parent && state) {
        return createCompatNavigationProp(parent, state, context.parent);
      }

      return undefined;
    }, */
  } as any;
}
