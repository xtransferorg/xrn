export interface CommonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

