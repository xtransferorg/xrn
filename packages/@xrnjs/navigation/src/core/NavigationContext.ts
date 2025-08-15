import React from "react";
import { StackNavigationProp } from "./react-navigation";

// @ts-expect-error
const NavigationContext = React.createContext<StackNavigationProp>(undefined);

export default NavigationContext;
