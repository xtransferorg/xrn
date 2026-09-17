import { RequestOption } from "../http/RequestOption"
import { http } from "@kit.NetworkKit"
import { BusinessError } from "@kit.BasicServicesKit"
import { HttpRequestError } from "./HttpRequestError"

const TAG = "[RemoteBundle]"

export async function request(option: RequestOption): Promise<string> {

  return new Promise((resolve, reject) => {
    try {
      console.log(TAG, `request:url=${option.url}, header=${JSON.stringify(option.header)}, body=${JSON.stringify(option.body)}`)
      const httpRequest = http.createHttp()
      httpRequest.request(option.url, {
        method: option.method,
        header: option.header,
        extraData: option.body,
        connectTimeout: option.connectTimeoutMills,
        readTimeout: option.readTimeoutMills,
      }, (err: BusinessError, data: http.HttpResponse) => {
        if (err) {
          console.log(TAG, `request:err=${JSON.stringify(err)}, url=${option.url}`)
          reject(new HttpRequestError(err.code, err.message, err))
        } else if (data?.responseCode != http.ResponseCode.OK) {
          let errorMessage: any
          if (data?.responseCode === 0) {
            errorMessage =
              `Couldn't send request to ${option.url}, xhr.statusCode = 0 was returned. One of the possible reasons for that might be connection problems. Please, check your internet connection.`
          } else {
            errorMessage = `${data.responseCode}: ${data.result}`
          }
          const error = new Error(errorMessage)
          console.log(TAG, `request:error=${JSON.stringify(error)}, url=${option.url}`)
          reject(error)
        } else {
          console.log(TAG, `request:result=${data?.result}`)
          resolve(data?.result as string)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}