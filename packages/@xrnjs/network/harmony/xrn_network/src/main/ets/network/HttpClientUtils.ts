import {
  HttpResponse,
  HttpErrorResponse,
  ReceivingProgress,
  SendingProgress,
} from '@rnoh/react-native-openharmony/src/main/ets/HttpClient/types';

export function mergeObjects<T>(baseObject: Partial<T>, overridingObject: Partial<T>): T {
  const mergedObject: Partial<Record<keyof T, any>> = {};

  const allKeys = new Set([
    ...Object.keys(baseObject),
    ...Object.keys(overridingObject)
  ]);

  allKeys.forEach((value: string) => {
    const key = value as keyof T;
    mergedObject[key] = overridingObject[key] !== null && overridingObject[key] !== undefined
      ? overridingObject[key]
      : baseObject[key];
  });

  return mergedObject as T;
}

export function getHeaderNumber(headers: Object, key: string): number {
  const value = (headers as Record<string, string | number | undefined>)[key];
  const parsed = Number(value);
  return value === undefined || value === null || isNaN(parsed) ? -1 : parsed;
}

export function buildHttpResponse(statusCode: number, headers: Object, body: ArrayBuffer): HttpResponse {
  return { statusCode, headers, body };
}

export function buildHttpErrorResponse(error: Error, statusCode: number, timeout?: boolean): HttpErrorResponse {
  return { statusCode, error, timeout };
}

export function buildReceivingProgress(totalLength: number, lengthReceived: number, bitsReceived: ArrayBuffer): ReceivingProgress {
  return { totalLength, lengthReceived, bitsReceived };
}

export function buildSendingProgress(totalLength: number, lengthSent: number): SendingProgress {
  return { totalLength, lengthSent };
}

export function applyCookieHeader(header: Object, cookiesForHeader: string): void {
  const target = header as Record<string, string>;
  if (target['cookie']) {
    target['cookie'] += '; ' + cookiesForHeader;
  } else {
    target['cookie'] = cookiesForHeader;
  }
}
