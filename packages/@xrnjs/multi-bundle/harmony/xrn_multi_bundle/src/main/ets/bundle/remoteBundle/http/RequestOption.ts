import { http } from "@kit.NetworkKit";

/**
 * http timeout option
 */
export class HttpTimeoutOption {
  /**
   * Connection timeout interval
   */
  connectTimeoutMills?: number;
  /**
   * Read timeout period
   */
  readTimeoutMills?: number;
}

/**
 * http request options
 */
export class RequestOption extends HttpTimeoutOption {
  /**
   * url
   */
  url: string;
  /**
   * http request method
   */
  method: http.RequestMethod;
  /**
   * http request header
   */
  header?: object;
  /**
   * http request body
   */
  body?: string | object | ArrayBuffer;
}