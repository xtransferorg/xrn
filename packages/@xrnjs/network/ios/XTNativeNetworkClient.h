/*
 * Copyright (c) XTransfer. All rights reserved.
 *
 * ── XTNativeNetworkClient ───────────────────────────────────────────────
 * 原生侧「请求层」：基于 XTNativeURLSessionHub 的统一 HTTP 客户端。
 *
 * 职责：
 *   1. 提供 GET/POST JSON、原始 dataTask 等高层 API
 *   2. 拼装 URL 参数、JSON body、超时、Header 等请求细节
 *   3. 统一错误处理、HTTP 状态码校验、JSON 解析
 *   4. 控制回调线程（主线程 / 后台）
 *
 * 调用方：XTJSBundleTool、CodePush、Widget 等原生模块。
 * 底层网络走 XTNativeURLSessionHub.sharedSession，性能数据由 Hub 发通知收口。
 *
 * 【分层关系】
 *   业务方 → XTNativeNetworkClient → XTNativeURLSessionHub → 网络
 * ─────────────────────────────────────────────────────────────────────────
 */

 #import <Foundation/Foundation.h>

 NS_ASSUME_NONNULL_BEGIN
 
 typedef void (^XTNativeNetworkDataCompletion)(NSData *_Nullable data, NSHTTPURLResponse *_Nullable response, NSError *_Nullable error);
 
 typedef void (^XTNativeNetworkJSONCompletion)(id _Nullable json, NSHTTPURLResponse *_Nullable response, NSError *_Nullable error);
 
 /// 单次请求的可选配置（超时、Header、回调线程、状态码校验等）
 @interface XTNativeNetworkRequestOptions : NSObject
 
 /// 请求超时（秒），0 表示使用默认 20s（对齐旧 XTNetworkTool）
 @property (nonatomic, assign) NSTimeInterval timeoutInterval;
 
 /// 额外 HTTP Header
 @property (nonatomic, copy, nullable) NSDictionary<NSString *, NSString *> *headers;
 
 /// 是否在主线程回调，默认 NO
 @property (nonatomic, assign) BOOL callbackOnMainQueue;
 
 /// 是否校验 HTTP 2xx，默认 YES
 @property (nonatomic, assign) BOOL validateHTTPStatusCode;
 
 @end


 
 /// 原生统一 HTTP 客户端单例
 @interface XTNativeNetworkClient : NSObject
 
 + (instancetype)sharedClient;
 

 /// GET 请求，自动解析 JSON 响应
 - (nullable NSURLSessionDataTask *)getJSON:(NSString *)URLString params:(nullable NSDictionary<NSString *, id> *)params options:(nullable XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkJSONCompletion)completion;
 
 /// POST 请求，jsonBody 序列化为 JSON，自动解析响应
 - (nullable NSURLSessionDataTask *)postJSON:(NSString *)URLString jsonBody:(nullable id)jsonBody options:(nullable XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkJSONCompletion)completion;
 
/// 原始 data 请求（适合 CodePush 等需自行解析响应的场景）
- (nullable NSURLSessionDataTask *)dataTaskWithRequest:(NSURLRequest *)request options:(nullable XTNativeNetworkRequestOptions *)options completion:(XTNativeNetworkDataCompletion)completion;


 @end
 
 NS_ASSUME_NONNULL_END
 
