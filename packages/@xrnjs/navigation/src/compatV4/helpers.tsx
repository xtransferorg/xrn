import { CommonActions, StackActionType } from '../core';
import * as NavigationActions from './NavigationActions';
import * as StackActions from './StackActions';
import { StackActionPayload } from './StackActions';

type NavigateActionPayload = Parameters<typeof NavigationActions.navigate>['0'];

type NavigateActionType = ReturnType<typeof NavigationActions.navigate>;

export function navigate(
  options:
    | { key: string; params?: object; path?: string; merge?: boolean }
    | {
        name: string;
        key?: string;
        params?: object;
        path?: string;
        merge?: boolean;
      }
    | NavigateActionPayload
): NavigateActionType;

// eslint-disable-next-line no-redeclare
export function navigate(
  name: string,
  params?: object,
  action?: never
): NavigateActionType;
// eslint-disable-next-line no-redeclare
export function navigate(...args: any): NavigateActionType {
  if (typeof args[0] === 'string') {
    return CommonActions.navigate({
      name: args[0],
      params: args[1],
      merge: true,
    });
  }

  if (typeof args[0] === 'object') {
    const payload = Object.assign({ merge: true }, args[0] || {});

    if (payload.hasOwnProperty('key') || payload.hasOwnProperty('name')) {
      return CommonActions.navigate(payload);
    } else if (payload.hasOwnProperty('routeName')) {
      return NavigationActions.navigate(payload);
    }
  }

  throw new Error(
    'You need to specify name or key when calling navigate with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigate for usage.'
  );
}

export function goBack(fromKey?: null | string) {
  return NavigationActions.back({ key: fromKey });
}

export function setParams(params: object) {
  return NavigationActions.setParams({ params });
}

export function reset() {
  return StackActions.reset();
}

export function replace(name: string, params?: object): StackActionType;
// eslint-disable-next-line no-redeclare
export function replace(options: StackActionPayload): StackActionType;
// eslint-disable-next-line no-redeclare
export function replace(
  options: string | StackActionPayload,
  params?: object
): StackActionType {
  return StackActions.replace(options, params);
}

export function push(name: string, params?: object): StackActionType;
// eslint-disable-next-line no-redeclare
export function push(options: StackActionPayload): StackActionType;
// eslint-disable-next-line no-redeclare
export function push(
  options: string | StackActionPayload,
  params?: object
): StackActionType {
  return StackActions.push(options, params);
}

export function pop(n: number = 1) {
  return StackActions.pop(typeof n === 'number' ? { n } : n);
}

export function popToTop() {
  return StackActions.popToTop();
}

export function dismiss() {
  return StackActions.dismiss();
}

/* export function jumpTo(routeName: string) {
  return SwitchActions.jumpTo({ routeName });
}

export function openDrawer() {
  return DrawerActions.openDrawer();
}

export function closeDrawer() {
  return DrawerActions.closeDrawer();
}

export function toggleDrawer() {
  return DrawerActions.toggleDrawer();
} */
