export class  HttpRequestError {
  code: number
  message: string
  error: any
  constructor(code: number, message: string, error?: any) {
    this.code = code
    this.message = message
    this.error = error
  }
}