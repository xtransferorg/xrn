/* eslint-disable @typescript-eslint/ban-ts-comment */
String.prototype.toLocaleLowerCase = function () {
  try {
    // @ts-expect-error
    if (__DEV__) {
      // console.warn('toLocaleLowerCase is not supported in this environment. Using toLowerCase instead.');
    }
  } catch {
    console.warn('__DEV__ is not defined. Using toLowerCase instead.');
  }
  return this.toLowerCase();
};

String.prototype.toLocaleUpperCase = function () {
  try {
    // @ts-expect-error
    if (__DEV__) {
      // console.warn('toLocaleUpperCase is not supported in this environment. Using toUpperCase instead.');
    }
  } catch {
    console.warn('__DEV__ is not defined. Using toUpperCase instead.');
  }
  return this.toUpperCase();
};
