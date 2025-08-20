import { useLayoutEffect } from "react";

import { Navigation } from "./navigationInstance";
import { useNavigationContainerRef } from "./react-navigation";

export const useNavigationContainerRefStack = <ParamList extends {}>() => {
  const navigationRef = useNavigationContainerRef<ParamList>();

  useLayoutEffect(() => {
    return () => {
      if (navigationRef) {
        Navigation.navigationContainerRefStack.pop(navigationRef);
      }
    };
  }, []);

  const pushRefToStack = () => {
    Navigation.navigationContainerRefStack.push(navigationRef);
  };

  return {
    navigationRef,
    pushRefToStack,
  };
};
