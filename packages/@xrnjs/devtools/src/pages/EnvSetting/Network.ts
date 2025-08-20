const codePushToken = "";

class RequestManager {
  private retryCount: number;
  private timeout: number;

  constructor(retryCount = 3, timeout = 5000) {
    this.retryCount = retryCount;
    this.timeout = timeout;
  }

  async requestAPI(url: string, attempt = 1): Promise<any> {
    console.log(`[请求 ${attempt}/${this.retryCount}] 开始:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${codePushToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[请求 ${attempt}/${this.retryCount}] 响应:`, response);

      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (attempt < this.retryCount) {
        console.warn(`[请求 ${attempt}/${this.retryCount}] 失败，重试中...`, error.message);
        return this.requestAPI(url, attempt + 1);
      }

      console.error(`[请求 ${attempt}/${this.retryCount}] 最终失败:`, error.message);
      return { error: error.message, code: -10000 };
    }
  }

  async executeRequests(urls: string[]): Promise<any[]> {
    try {
      console.log("批量请求开始:", urls);
      const results = await this.mergeRequest(urls);
      console.log("批量请求完成:", results);
      return results;
    } catch (error) {
      console.error("批量请求失败:", error);
      return [];
    }
  }

  async mergeRequest(urls: string[]): Promise<any[]> {
    const promises = urls.map((url) =>
      this.requestAPI(url)
        .then((response) => ({ url, data: response }))
        .catch((error) => ({ url, error: error.message })),
    );
    return Promise.all(promises);
  }
}

export default RequestManager;
