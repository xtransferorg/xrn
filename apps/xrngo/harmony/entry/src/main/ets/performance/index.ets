
export const XRN_PERFORMANCE_APPSTARTUPTIME = 'XRN_PERFORMANCE_APPSTARTUPTIME'
export const XRN_PERFORMANCE_BUNDLETIMES = 'XRN_PERFORMANCE_BUNDLETIMES'

export class XrnPerformance {
  static instance:XrnPerformance

  static getInstance() {
    if(!XrnPerformance.instance) {
      XrnPerformance.instance = new XrnPerformance()

      console.log('xrn performance 初始化...')
      globalThis.XRN_PERFORMANCE_APPSTARTUPTIME = {}
      globalThis.XRN_PERFORMANCE_BUNDLETIMES = {}
    }
    return XrnPerformance.instance
  }

  markStartupTime() {
    console.warn('app启动时间戳:', Date.now())
    globalThis.XRN_PERFORMANCE_APPSTARTUPTIME.startUpTime = Date.now()
  }

  /**
   * @param bundle http://localhost:8081/index.bundle?platform=harmony&dev=true&minify=false
   * @param bundleStartTime Date.now()时间戳
   * @param bundleEndTime Date.now()时间戳
   */
  markBundleTime(bundle: string, bundleStartTime: number, bundleEndTime: number) {
    globalThis.XRN_PERFORMANCE_BUNDLETIMES[bundle] = {
      bundleStartTime,
      bundleEndTime
    }
  }
}
