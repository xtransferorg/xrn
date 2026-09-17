import { useLayoutEffect } from "react";

import { Navigation } from "./navigationInstance";
import { useNavigationContainerRef } from "./react-navigation";

export const useNavigationContainerRefStack = <ParamList extends {}>(
  key: string,
) => {
  const navigationRef = useNavigationContainerRef<ParamList>();

  useLayoutEffect(() => {
    return () => {
      Navigation.navigationContainerRefStack.pop(key);
    };
  }, [key]);

  const pushRefToStack = () => {
    Navigation.navigationContainerRefStack.push(key, navigationRef);
  };

  return {
    navigationRef,
    pushRefToStack,
  };
};
