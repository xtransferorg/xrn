import http from '@ohos.net.http'

export interface StreamRequestOptions {
  url: string;
  method: http.RequestMethod;
  header?: object;
  body?: string;
  connectTimeoutMills?: number;
  readTimeoutMills?: number;
  timeoutMills?: number;
  onProgress?: (progress: number) => void;
}

export const DEFAULT_HTTP_CONNECT_TIMEOUT_MILLS = 10_000
export const DEFAULT_HTTP_READ_TIMEOUT_MILLS = 10_000
export const DEFAULT_HTTP_TOTAL_TIMEOUT_MILLS = 20_000

export function requestArrayBufferInStream(options: StreamRequestOptions): Promise<ArrayBuffer> {
  const requestTag = `${options.method} ${options.url}`
  return new Promise((resolve, reject) => {
    const httpRequest = http.createHttp()
    const dataChunks: ArrayBuffer[] = []
    let result: ArrayBuffer | undefined
    let headers: object | undefined
    let responseCode: number | undefined
    let finished = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const totalTimeout = options.timeoutMills ?? DEFAULT_HTTP_TOTAL_TIMEOUT_MILLS
    const connectTimeout = options.connectTimeoutMills ?? DEFAULT_HTTP_CONNECT_TIMEOUT_MILLS
    const readTimeout = options.readTimeoutMills ?? DEFAULT_HTTP_READ_TIMEOUT_MILLS

    const parseErrorMessage = (err: unknown): string => {
      if (!err) return 'unknown error'
      const maybeErr = err as { code?: number; message?: string; toString?: () => string }
      if (maybeErr.message) {
        return maybeErr.code !== undefined
          ? `code=${maybeErr.code}, message=${maybeErr.message}`
          : maybeErr.message
      }
      return maybeErr.toString ? maybeErr.toString() : JSON.stringify(err)
    }

    function cleanUp() {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
      try {
        httpRequest.destroy()
      } catch {
        // ignore destroy errors
      }
    }

    function rejectOnce(error: Error) {
      if (finished) return
      finished = true
      reject(error)
      cleanUp()
    }

    function resolveOnce(data: ArrayBuffer) {
      if (finished) return
      finished = true
      resolve(data)
      cleanUp()
    }

    function maybeResolve() {
      if (finished || result === undefined || headers === undefined || responseCode === undefined) {
        return
      }
      if (responseCode !== http.ResponseCode.OK) {
        rejectOnce(new Error(`request failed: ${requestTag}, http=${responseCode}`))
        return
      }
      resolveOnce(result)
    }

    httpRequest.on('dataReceiveProgress', ({ receiveSize, totalSize }) => {
      options.onProgress?.(totalSize > 0 ? receiveSize / totalSize : 0)
    })

    httpRequest.on('headersReceive', (data) => {
      headers = data
      maybeResolve()
    })

    httpRequest.on('dataReceive', (chunk) => {
      dataChunks.push(chunk)
    })

    httpRequest.on('dataEnd', () => {
      const totalLength = dataChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
      const data = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of dataChunks) {
        data.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }
      result = data.buffer
      maybeResolve()
    })

    timeoutId = setTimeout(() => {
      rejectOnce(new Error(`request timeout: ${requestTag}, timeout=${totalTimeout}ms`))
    }, totalTimeout)

    try {
      httpRequest.requestInStream(
        options.url,
        {
          method: options.method,
          header: options.header,
          extraData: options.body,
          connectTimeout,
          readTimeout,
        },
        (err, code) => {
          responseCode = code
          if (err) {
            rejectOnce(new Error(`request error: ${requestTag}, ${parseErrorMessage(err)}`))
          } else {
            maybeResolve()
          }
        }
      )
    } catch (err) {
      rejectOnce(new Error(`request exception: ${requestTag}, ${parseErrorMessage(err)}`))
    }
  })
}