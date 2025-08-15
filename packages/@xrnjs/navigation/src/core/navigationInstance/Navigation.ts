import { NavigationState } from "../react-navigation";
import { StackRouterStateIntercept } from "../routers/StackRouter";
import {
  NavigationContainerRefStack,
  NavigationContainerRefStackImpl,
} from "./NavigationContainerRefStack";
import {
  NavigationInterceptorManager,
  StackNavigationInterceptorManagerImpl,
} from "./NavigationInterceptorManager";
import NavigationOptionManager from "./NavigationOptionManager";

export type NavigationInstance<
  State extends NavigationState,
  ParamList extends {},
> = {
  navigationContainerRefStack: NavigationContainerRefStack<ParamList>;
  navigationOptions: NavigationOptionManager;
  interceptor: NavigationInterceptorManager<State>;

  current: () => ReturnType<NavigationContainerRefStack<ParamList>["peek"]>;
};

class NavigationInstanceImpl
  implements NavigationInstance<NavigationState, {}>
{
  navigationContainerRefStack: NavigationContainerRefStack<{}>;

  navigationOptions: NavigationOptionManager;

  interceptor: StackNavigationInterceptorManagerImpl;

  constructor() {
    this.navigationContainerRefStack = new NavigationContainerRefStackImpl();
    this.navigationOptions = new NavigationOptionManager();
    this.interceptor = new StackNavigationInterceptorManagerImpl();
  }

  stackRouterInterceptor: StackRouterStateIntercept = (
    action,
    prevState,
    nextState,
    extraData,
  ) => {
    return this.interceptor.intercept({
      action,
      navigation: this.current(),
      prevState,
      nextState,
      extraData,
    });
  };

  current() {
    return this.navigationContainerRefStack.peek();
  }

  addRefStackChangeListener(
    listener: (ref: ReturnType<NavigationContainerRefStack<{}>["peek"]>) => void,
  ) {
    this.navigationContainerRefStack.addListener("change", listener);
  }
}

export const Navigation = new NavigationInstanceImpl();
