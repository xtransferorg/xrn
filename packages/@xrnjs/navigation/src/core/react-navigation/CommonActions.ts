import { CommonActions as OriginCommonActions } from "@react-navigation/native";

export type Action = OriginCommonActions.Action;

export function navigate(
  options:
    | { key: string; params?: object; path?: string; merge?: boolean }
    | {
        name: string;
        key?: string;
        params?: object;
        path?: string;
        merge?: boolean;
      },
): Action;
// eslint-disable-next-line no-redeclare
export function navigate(name: string, params?: object): Action;
// eslint-disable-next-line no-redeclare
export function navigate(...args: any): Action {
  if (typeof args[0] === "string") {
    return {
      type: "NAVIGATE",
      payload: { name: args[0], params: args[1], merge: true },
    };
  } else {
    const payload = Object.assign({ merge: true }, args[0] || {});

    if (!payload.hasOwnProperty("key") && !payload.hasOwnProperty("name")) {
      throw new Error(
        "You need to specify name or key when calling navigate with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigate for usage.",
      );
    }

    return { type: "NAVIGATE", payload };
  }
}

export const goBack = OriginCommonActions.goBack;
export const reset = OriginCommonActions.reset;
export const setParams = OriginCommonActions.setParams;
