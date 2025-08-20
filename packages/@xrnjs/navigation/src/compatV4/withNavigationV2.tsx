import * as React from 'react';
import {
  CompatNavigationProp,
  NavigationContext,
  NavigationPropType,
  ParamListBase,
  RouteProp,
  useNavigation,
  useRoute,
} from '../core';

type InjectedProps<T extends NavigationPropType<ParamListBase>> = {
  route: RouteProp<ParamListBase>;
  navigation: CompatNavigationProp<ParamListBase, T>;
};

export default function withNavigation<
  T extends NavigationPropType<ParamListBase>,
  P extends InjectedProps<T>,
  C extends React.ComponentType<P>,
>(Comp: C, wrapperContext: boolean = false) {
  const WrappedComponent = ({
    onRef,
    ...rest
  }: Exclude<P, InjectedProps<T>> & {
    onRef?: C extends React.ComponentClass<any>
      ? React.Ref<InstanceType<C>>
      : never;
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

    // @ts-expect-error: type checking HOC is hard
    return <Comp ref={onRef} route={route} navigation={navigation} {...rest} />;
  };

  WrappedComponent.displayName = `withNavigation(${
    Comp.displayName || Comp.name
  })`;

  return WrappedComponent;
}
