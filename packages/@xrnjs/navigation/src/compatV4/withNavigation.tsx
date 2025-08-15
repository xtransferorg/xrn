import * as React from 'react';
import {
  useNavigation,
  useRoute,
  NavigationContext,
  ParamListBase,
} from '../core';

import { NavigationInjectedProps } from './types';

export default function withNavigation<
  P extends NavigationInjectedProps | {} = NavigationInjectedProps,
  T extends null | ParamListBase | React.ComponentClass<P> = ParamListBase,
  C = T extends null
    ? React.ComponentType<P>
    : T extends ParamListBase
      ? React.ComponentType<P & NavigationInjectedProps>
      : T & React.ComponentClass<P>,
>(
  Comp: C,
  wrapperContext: boolean = false
): React.ComponentType<
  Omit<P, keyof NavigationInjectedProps> & {
    onRef?: React.Ref<
      T extends ParamListBase
        ? React.Component<T & NavigationInjectedProps<P>>
        : T extends React.ComponentClass<P>
          ? InstanceType<T>
          : never
    >;
  }
> {
  const WrappedComponent = ({
    onRef,
    ...rest
  }: Omit<P, keyof NavigationInjectedProps> & {
    onRef?: React.Ref<
      T extends ParamListBase
        ? React.Component<T & NavigationInjectedProps<P>>
        : T extends React.ComponentClass<P>
          ? InstanceType<T>
          : never
    >;
  }): React.ReactElement => {
    const route = useRoute();
    const navigation = useNavigation();

    if (wrapperContext) {
      return (
        <NavigationContext.Provider value={navigation}>
          {/* @ts-expect-error: type checking HOC is hard*/}
          <Comp ref={onRef} {...rest} route={route} navigation={navigation} />
        </NavigationContext.Provider>
      );
    }

    return (
      <>
        {/* @ts-expect-error: type checking HOC is hard*/}
        <Comp ref={onRef} {...rest} route={route} navigation={navigation} />
      </>
    );
  };

  /* WrappedComponent.displayName = `withNavigation(${
    Comp.displayName || Comp.name
  })`; */

  return WrappedComponent;
}
