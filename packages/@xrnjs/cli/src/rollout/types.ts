export enum NativeAppVersionStatus {
    ReadyForReview = 'ready_for_review',
    PendingReview = 'pending_review',
    /** 市场审核通过，尚未开始应用内灰度放量 */
    MarketApproved = 'market_approved',
    Rollout = 'rollout',
    /** 灰度暂停，存量灰度用户仍需收到热更新 */
    Paused = 'paused',
    Published = 'published',
    /** 灰度已关闭，存量用户按正式用户对待 */
    RolloutClosed = 'rollout_closed',
    Discarded = 'discarded',
  }

export interface AppRolloutOptions {
    versionId: string; // 版本id
    rollout: number; // 灰度流量 0~100
    isBackwardCompatible: boolean; // 是否向下兼容
    status: NativeAppVersionStatus; // 发布状态
    whiteList?: string; // 白名单，设备id 逗号分割
    updateType?: 'Force' | 'Silent'; // 更新类型
    onlyApplyVersion?: string; // 只应用于某个版本
    notOnlyApplyVersion?: string; // 除了此版本的App都能收到本次更新
}
  