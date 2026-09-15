import http from '@ohos.net.http'
import { DefaultHttpClient } from '@rnoh/react-native-openharmony/src/main/ets/HttpClient'
import {
  CancelRequestCallback,
  HttpResponse,
  RequestOptions,
} from '@rnoh/react-native-openharmony/src/main/ets/HttpClient/types'
import { getModuleRouteParams, ModuleRouteParams } from 'xrn-navigation'
import { RN_INSTANCE_MANAGER } from 'xrn-multi-bundle';
import { RNInstance, RNOHLogger } from '@rnoh/react-native-openharmony';
import {
  mergeObjects,
  getHeaderNumber,
  buildHttpResponse,
  buildHttpErrorResponse,
  buildReceivingProgress,
  buildSendingProgress,
  applyCookieHeader,
} from './HttpClientUtils';

const TAG = '[XRNCustomHttpClient]'

class XTSendRequestResult {
  cancel: CancelRequestCallback = () => {}
  promise: Promise<HttpResponse> = Promise.resolve(buildHttpResponse(0, new Object(), new ArrayBuffer(0)))
}

interface NativeTimingPayload {
  fetchStart?: number;
  dnsStart?: number;
  dnsEnd?: number;
  connectStart?: number;
  connectEnd?: number;
  tcpStart?: number;
  tcpEnd?: number;
  tlsStart?: number;
  tlsEnd?: number;
  requestStart?: number;
  requestEnd?: number;
  responseStart?: number;
  responseEnd?: number;
  fetchEnd?: number;
}

interface NativeConnectionPayload {
  redirectCount?: number;
  reusedConnection?: number | string;
  proxyConnection?: number | string;
  remoteAddress?: string;
  netType?: string;
}

interface NativeNetworkMetricsEvent {
  requestId: number;
  timing: NativeTimingPayload;
  connection?: NativeConnectionPayload;
}

export class XRNCustomHttpClient extends DefaultHttpClient {
  private readonly xrnLogger?: RNOHLogger

  constructor(logger?: RNOHLogger) {
    super({ logger })
    this.xrnLogger = logger?.clone('XRNCustomHttpClient')
  }

  private recordTTFB(url: string, requestStartTime: number, requestOptions: RequestOptions): void {
    // const ttfb = Date.now() - requestStartTime
    // console.log(`${TAG}, requestId=${requestOptions.requestId} ttfb=${ttfb}ms url=${url}`)

    try {
      const params = getModuleRouteParams()
      const bundleName = params?.bundleName
      if (!bundleName) {
        this.xrnLogger?.clone('recordTTFB').warn('bundleName is missing, skip TTFB reporting')
        return
      }
      
      const rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName)
      const netData: NativeNetworkMetricsEvent = {
        requestId: requestOptions.requestId ?? -1,
        timing: {
          fetchStart: requestStartTime,
          responseStart: Date.now()
        },
      }

      // TODO:这里获取的rnInstance是顶层引擎实例，如果从A进入到B，此时上报只会上报B bundle的ttfb，A背后的网络无法上报，后续优化处理
      // console.log(`${TAG}, didCollectNetworkTaskMetrics=${JSON.stringify(netData)}`)
      rnInstance?.emitDeviceEvent("didCollectNetworkTaskMetrics", netData)
    } catch (error) {
      this.xrnLogger?.clone('recordTTFB').error(`Failed to record TTFB: ${error}`)
    }
  }

  sendRequest(url: string, requestOptions: RequestOptions): XTSendRequestResult {
    const httpRequest = http.createHttp();
    const requestStartTime = Date.now()
    let didRecordTTFB = false
    let timeoutId: number = -1;
    const cleanup = () => {
      httpRequest.destroy();
      if (timeoutId >= 0) {
        clearTimeout(timeoutId);
      }
    }
    const promise: Promise<HttpResponse> = new Promise((resolve, reject) => {

      let headers: Object | undefined;
      let resultBody: ArrayBuffer;
      let responseCode: number;

      let currentLength = 0;
      let totalLength = -1;
      const dataChunks: ArrayBuffer[] = [];

      const maybeResolve = () => {
        if (resultBody != undefined && headers != undefined && responseCode != undefined) {
          let finalResponse: HttpResponse = buildHttpResponse(responseCode, headers, resultBody)
          for (const interceptor of this.responseInterceptors) {
            if (interceptor.shouldIntercept(url, finalResponse)) {
              finalResponse = interceptor.intercept(url, finalResponse)
            }
          }
          resolve(finalResponse);
          cleanup();
        }
      }

      let finalRequestOptions: RequestOptions = mergeObjects(this.baseRequestOptions, requestOptions);
      if (finalRequestOptions.timeout) {
        timeoutId = setTimeout(() => {
          httpRequest.destroy();
          reject(buildHttpErrorResponse(Error('Request timeout.'), 0, true))
        }, finalRequestOptions.timeout)
      }

      for (const interceptor of this.requestInterceptors) {
        if (interceptor.shouldIntercept(url, finalRequestOptions)) {
          const interceptedResult = interceptor.intercept(url, finalRequestOptions)
          url = interceptedResult.url
          requestOptions = interceptedResult.requestOptions
          finalRequestOptions = requestOptions
        }
      }

      if (requestOptions.handleCookies) {
        const cookies = this.fetchCookies(url);
        const cookiesForHeader = cookies.replace(/,/g, ';');
        const header = requestOptions.header ?? new Object()
        applyCookieHeader(header, cookiesForHeader)
        requestOptions.header = header
      }

      httpRequest.once('headersReceive', (data) => {
        const responseHeaders: Object = data
        headers = responseHeaders;
        totalLength = getHeaderNumber(responseHeaders, 'content-length');
        this.setCookiesFromHeaders(url, responseHeaders);

        if (!didRecordTTFB) {
          didRecordTTFB = true
          this.recordTTFB(url, requestStartTime, requestOptions)
        }

        maybeResolve();
      })

      httpRequest.on('dataReceive', (chunk) => {
        dataChunks.push(chunk);
        currentLength += chunk.byteLength;
        if (requestOptions.onReceiveProgress) {
          requestOptions.onReceiveProgress(buildReceivingProgress(totalLength, currentLength, chunk))
        }
      })

      httpRequest.on('dataSendProgress', (progress) => {
        if (requestOptions.onSendProgress) {
          requestOptions.onSendProgress(buildSendingProgress(progress.totalSize, progress.sendSize))
        }
      })

      httpRequest.on('dataEnd', () => {
        const totalLength = dataChunks.map(chunk => chunk.byteLength).reduce((acc, length) => acc + length, 0);
        const data = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of dataChunks) {
          const chunkArray = new Uint8Array(chunk);
          data.set(chunkArray, offset);
          offset += chunk.byteLength;
        }
        resultBody = data.buffer as ArrayBuffer;
        maybeResolve();
      })

      try {
        httpRequest.requestInStream(
          url,
          finalRequestOptions,
          (err, data) => {
            responseCode = data;
            if (err) {
              if (err.code === 201) {
                this.xrnLogger
                ?.clone('requestInStream')
                  .error('Permission denied. Check if \'ohos.permission.INTERNET\' has been granted')
              }
              cleanup();
              reject(buildHttpErrorResponse(err, responseCode ?? 0));
            } else {
              maybeResolve();
            }
          }
        );
      } catch (err) {
        cleanup();
        reject(buildHttpErrorResponse(err as Error, 0));
      }
    });

    const result = new XTSendRequestResult()
    result.cancel = cleanup
    result.promise = promise
    return result;
  }
}
