import {
  NavigationAction,
  NavigationContainerRef,
  NavigationState,
  ParamListBase,
  PartialState,
  StackNavigationState,
} from "../react-navigation";

export type NavigationInterceptExtraData = Record<string, any>;

type MixedNavigationState<State extends NavigationState> =
  | State
  | PartialState<State>
  | null;

type NavigationInterceptorCtx<State extends NavigationState> = {
  navigation?: NavigationContainerRef<{}>;
  action: NavigationAction;
  prevState: MixedNavigationState<State>;
  nextState: MixedNavigationState<State>;
  prevRouteName: string | null;
  nextRouteName: string | null;
  extraData?: NavigationInterceptExtraData;
};

export type NavigationInterceptor<State extends NavigationState> = (
  ctx: NavigationInterceptorCtx<State>,
) => boolean | void | null | undefined;

export type NavigationInterceptorManager<State extends NavigationState> = {
  use: (intercept: NavigationInterceptor<State>) => number;
  eject: (id: number) => void;
  clear: () => void;
};

type StackNavigationInterceptorForEachCtx = Omit<
  NavigationInterceptorCtx<StackNavigationState<ParamListBase>>,
  "prevRouteName" | "nextRouteName"
>;

export type StackNavigationInterceptor = NavigationInterceptor<
  StackNavigationState<ParamListBase>
>;

type StackNavigationInterceptorManager = NavigationInterceptorManager<
  StackNavigationState<ParamListBase>
>;

export class StackNavigationInterceptorManagerImpl
  implements StackNavigationInterceptorManager
{
  interceptors: (StackNavigationInterceptor | null)[] = [];

  use(interceptor: StackNavigationInterceptor) {
    this.interceptors.push(interceptor);
    return this.interceptors.length - 1;
  }

  eject(id: number) {
    if (this.interceptors[id]) {
      this.interceptors[id] = null;
    }
  }

  clear() {
    this.interceptors = [];
  }

  intercept(ctx: StackNavigationInterceptorForEachCtx) {
    const { prevState, nextState } = ctx;

    let prevRouteName = getRouteNameFromState(prevState);
    let nextRouteName = getRouteNameFromState(nextState);

    for (let i = 0; i < this.interceptors.length; i++) {
      const interceptor = this.interceptors[i];
      if (
        interceptor &&
        interceptor({ ...ctx, prevRouteName, nextRouteName }) ===
          false
      ) {
        return false;
      }
    }

    return true;
  }
}

const getRouteNameFromState = (
  state: MixedNavigationState<StackNavigationState<ParamListBase>>,
): string | null => {
  if (
    state &&
    "index" in state &&
    "routes" in state &&
    typeof state.index === "number" &&
    Array.isArray(state.routes)
  ) {
    const parentRoute = state.routes[state.index];

    return (
      getRouteNameFromState(parentRoute as any) || parentRoute.name || null
    );
  }

  return null;
};
