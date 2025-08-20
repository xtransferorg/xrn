import {
  MixedStackAction,
  StackNavigationState,
  StackRouter as OriginStackRouter,
  StackRouterOptions,
  Router,
  ParamListBase,
  PartialState,
  NavigationState,
} from "../react-navigation";

type StackRouterInterceptExtraData = Record<string, any>;

export type StackRouterStateIntercept<
  State extends NavigationState = StackNavigationState<ParamListBase>,
  MixedState = State | PartialState<State> | null,
> = (
  action: MixedStackAction,
  prevState: MixedState,
  nextState: MixedState,
  extraData?: StackRouterInterceptExtraData,
) => boolean;

export default function StackRouter(intercept?: StackRouterStateIntercept) {
  return (options: StackRouterOptions) => {
    const originStackRouter = OriginStackRouter(options);

    const router: Router<
      StackNavigationState<ParamListBase>,
      MixedStackAction
    > = {
      ...originStackRouter,

      /* getInitialState(options) {
        const nextState = originStackRouter.getInitialState(options);

        if (intercept && !intercept(null, nextState)) {
          return {
            ...nextState,
            routes: []
          }
        }

        return nextState;
      }, */

      getStateForAction(state, action, options) {
        const prevState = state;
        const nextState = originStackRouter.getStateForAction(
          state,
          action,
          options,
        );

        if (intercept && intercept(action, prevState, nextState) === false) {
          return prevState;
        }

        return nextState;
      },
    };

    return router;
  };
}
