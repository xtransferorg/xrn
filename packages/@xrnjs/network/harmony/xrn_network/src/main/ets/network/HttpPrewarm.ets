import http from '@ohos.net.http'
import { RequestOptions } from '@rnoh/react-native-openharmony/src/main/ets/HttpClient/types'
import { XRNCustomHttpClient } from './XRNCustomHttpClient'
import {
  RNOHLogger,
  StandardRNOHLogger,
} from '@rnoh/react-native-openharmony'

const logger: RNOHLogger =
  new StandardRNOHLogger().clone('HttpPrewarm')

// const TAG = '[HttpPrewarm]'
const DEFAULT_TIMEOUT_MS = 5000

function normalizeUrl(domain: string): string {
  const trimmed = domain.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

function buildPrewarmRequestOptions(timeoutMs: number): RequestOptions {
  const options: http.HttpRequestOptions = {
    method: http.RequestMethod.HEAD,
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
  }
  const requestOptions = options as RequestOptions
  requestOptions.timeout = timeoutMs
  return requestOptions
}

async function prewarmDomain(
  httpClient: XRNCustomHttpClient,
  url: string,
  requestOptions: RequestOptions,
): Promise<void> {
  try {
    await httpClient.sendRequest(url, requestOptions).promise
    // logger.info(`prewarm success url=${url}`)
  } catch (err) {
    // logger.warn(`prewarm failed url=${url} err=${JSON.stringify(err)}`)
  }
}

export function prewarmDomains(domains: string[], timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
  if (!domains || domains.length === 0) {
    return Promise.resolve()
  }

  const httpClient = new XRNCustomHttpClient(logger)
  const tasks: Promise<void>[] = []

  for (const domain of domains) {
    if (!domain || domain.trim().length === 0) {
      continue
    }
  
    const url = normalizeUrl(domain)
    const requestOptions = buildPrewarmRequestOptions(timeoutMs)
  
    tasks.push(prewarmDomain(httpClient, url, requestOptions))
  }

  return Promise.all(tasks).then(() => {})
}