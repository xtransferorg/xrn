import {
  CommonActions,
  StackActions,
  StackActionType,
} from '@react-navigation/native';

type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]: T[P] } & Partial<Record<Exclude<keyof T, K>, never>>
  : never;

export type StackActionPayload = AtLeastOne<{
  name: string;
  routeName: string;
}> & {
  params?: object;
  action?: never;
};

export function reset(): CommonActions.Action {
  throw new Error(
    'The legacy `reset` action is not supported. Use the new reset API by accessing the original navigation object at `navigation.original`.'
  );
}

export function replace(
  name: string | StackActionPayload,
  params?: object
): StackActionType {
  console.log('replace', name, params);
  if (typeof name === 'object') {
    if (name.action !== undefined) {
      throw new Error(
        'Sub-actions are not supported for `replace`. Remove the `action` key from the options.'
      );
    }

    if (!name.name && !name.routeName) {
      throw new Error('Missing `name` key in options for `replace` action');
    }

    return StackActions.replace(name.name! || name.routeName!, name.params);
  } else {
    return StackActions.replace(name, params);
  }
}

export function push(
  name: string | StackActionPayload,
  params?: object
): StackActionType {
  if (typeof name === 'object') {
    if (name.action !== undefined) {
      throw new Error(
        'Sub-actions are not supported for `push`. Remove the `action` key from the options.'
      );
    }

    if (!name.name && !name.routeName) {
      throw new Error('Missing `name` key in options for `push` action');
    }

    return StackActions.push(name.name! || name.routeName!, name.params);
  } else {
    return StackActions.push(name, params);
  }
}

export function pop({ n = 1 }: { n: number }): StackActionType {
  return StackActions.pop(n);
}

export function popToTop(): StackActionType {
  return StackActions.popToTop();
}

export function dismiss(): CommonActions.Action {
  throw new Error('The legacy `dismiss` action is not supported.');
}
