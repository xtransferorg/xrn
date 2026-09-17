
export type XRNDebugToolsType = {

  /**
   * 清除缓存
   */
  cleanAppCache(): Promise<boolean>;
  /**
   * reloadBundle
   */
  reloadBundle(): Promise<boolean>;
  /**
   * 获取所有bundle信息
   */
  getAllBundlesDataSync(): Promise<Object[]>;
  /**
   * mock native 崩溃
   */
  nativeCrash(): Promise<boolean>;
  /**
   * 获取native路由栈
   */
  routeInfo(): Promise<Object[]>;
  /**
   * 元素审查
   */
  toggleInspector(): Promise<boolean>;
  /**
   * 元素审查的状态
   */
  getInspectorIsShown(): Promise<boolean>;
  /**
   * 性能指标
   */
  togglePerfMonitor(): Promise<boolean>;
  /**
   * 性能指标状态
   */
  getPerfMonitorIsShown():Promise<boolean>;
  /**
   * 内存泄漏检测（仅状态开关/占位）
   */
  toggleMemoryLeak(): Promise<boolean>;
  /**
   * 内存泄漏检测开关状态
   */
  getMemoryLeakIsShown(): Promise<boolean>;
  /**
   * ping
   * @param host 
   */
  pingStart(host: string): Promise<Object>;
  /**
   * dns
   * @param host 
   */
  dnsStart(host: string): Promise<Object>;
  /**
   * 网络代理
   * @param url 
   */
  proxyInfo(url: string): Promise<Object>;
};
