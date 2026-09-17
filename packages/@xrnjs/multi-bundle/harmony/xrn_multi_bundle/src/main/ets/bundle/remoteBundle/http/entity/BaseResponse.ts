export class BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}