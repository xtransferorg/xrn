/**
 * Ambient type declaration for @react-native-community/cli-server-api (RN 0.77).
 * The CLI 15 package restructured its exports; `indexPageMiddleware` was a
 * direct export in CLI 9 but in CLI 15 the middleware object is returned by
 * createDevServerMiddleware. This stub keeps the old import path compiling.
 * Runtime: callers should obtain the middleware from createDevServerMiddleware
 * return value; this direct import is retained for source compatibility.
 */
declare module '@react-native-community/cli-server-api' {
  // Express-like middleware: has use() to mount sub-middleware.
  export interface Middleware {
    use(...args: any[]): void
    (...args: any[]): void
    [key: string]: any
  }

  export interface DevServerMiddlewareResult {
    middleware: Middleware
    websocketEndpoints: any
    messageSocketEndpoint: any
    eventsSocketEndpoint: any
  }

  export function createDevServerMiddleware(opts: {
    host: string
    port: number
    watchFolders: string[]
  }): DevServerMiddlewareResult

  /** @deprecated CLI 15 moved this into createDevServerMiddleware's return; kept for source compat. */
  export const indexPageMiddleware: Middleware

  /** @deprecated CLI 15 removed releaseChecker; kept as no-op stub for source compat. */
  export const releaseChecker: () => void
}

declare module '@react-native-community/cli-tools' {
  export const logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void; debug: (m: string) => void }
  /** @deprecated CLI 15 removed releaseChecker; kept as no-op stub for source compat. */
  export const releaseChecker: () => void
}
