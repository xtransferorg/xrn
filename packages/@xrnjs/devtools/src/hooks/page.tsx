import { ReactElement,useCallback,useMemo } from "react";

export function useNavRightButton(createRightButton: (params: any) => ReactElement, ...params: any) {
    return useMemo(() => {
        return createRightButton(params)
    }, params);

}

export function useNavOnBack(onBack: (params: any) => boolean, ...params: any) {
    return useCallback(() => {
        return onBack(params)
    }, params);

}