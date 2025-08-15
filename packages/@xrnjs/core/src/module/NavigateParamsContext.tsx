

import * as React from 'react';
import { ViewProps } from 'react-native';

const NavigateParamsContext = React.createContext<NavigateBundleBean | null>(null);


function useNavigateBundleParams(): NavigateBundleBean | null {
    return React.useContext(NavigateParamsContext);
}

interface NavigateBundleBean {
    rootTag: number;
    moduleName: string;
    params: string | object | null;
}


type NavigateBundleProps = ViewProps & NavigateBundleBean
const NavigateBundleProvider = (props: NavigateBundleProps) => {

    const [navigateBundleBean] = React.useState<NavigateBundleBean | null>(
        { ...props, params: typeof props.params === 'object' ? props.params : JSON.parse(props.params || '') }
    );

    return (
        <NavigateParamsContext.Provider value={navigateBundleBean}>
            {props.children}
        </NavigateParamsContext.Provider>
    );
};

export { NavigateBundleProvider, NavigateParamsContext, useNavigateBundleParams, NavigateBundleProps };
