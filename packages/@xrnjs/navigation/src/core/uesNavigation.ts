import React from 'react';
import {
  CompatNavigationProp,
  StackNavigationProp,
  useNavigationState,
  useNavigation as useOriginalNavigation,
  useRoute,
} from './react-navigation';

import createCompatNavigationProp from '../compatV4/createCompatNavigationProp';

export default function useNavigation<
  T extends CompatNavigationProp = StackNavigationProp,
>() {
  const navigation = useOriginalNavigation();

  const route = useRoute();

  const isFirstRouteInParent = useNavigationState(
    (state) => state.routes[0]?.key === route.key
  );

  const context = React.useRef<Record<string, any>>({});

  return React.useMemo(() => {
    return createCompatNavigationProp(
      navigation,
      route as any,
      context.current,
      isFirstRouteInParent
    ) as T;
  }, [navigation, route, isFirstRouteInParent]);
}
