/**
 * Common response interface for API requests
 * Standardizes the structure of API responses across the application
 * 
 * @template T - Type of the data payload in the response
 */
export interface CommonResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response message or error description */
  message: string;
  /** Response data payload */
  data: T;
}

