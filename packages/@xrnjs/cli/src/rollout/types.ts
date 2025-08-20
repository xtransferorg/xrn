/**
 * TypeScript type definitions for app rollout functionality
 * Defines interfaces and enums used for staged app deployment and traffic control
 */

/**
 * Native app version status enumeration
 * Represents different states in the app release lifecycle
 */
export enum NativeAppVersionStatus {
    /** Version is ready for review */
    ReadyForReview = 'ready_for_review',
    /** Version is pending review */
    PendingReview = 'pending_review',
    /** Version is in rollout phase */
    Rollout = 'rollout',
    /** Version is published to all users */
    Published = 'published',
    /** Version has been discarded */
    Discarded = 'discarded',
  }

/**
 * App rollout options interface
 * Contains configuration for staged app deployment and traffic control
 */
export interface AppRolloutOptions {
    /** Version ID for the rollout */
    versionId: string;
    /** Rollout percentage (0-100) */
    rollout: number;
    /** Whether the version is backward compatible */
    isBackwardCompatible: boolean;
    /** Current release status */
    status: NativeAppVersionStatus;
    /** Whitelist of device IDs (comma-separated) */
    whiteList?: string;
    /** Type of update (Force or Silent) */
    updateType?: 'Force' | 'Silent';
    /** Only apply to specific version */
    onlyApplyVersion?: string;
    /** Apply to all versions except specified one */
    notOnlyApplyVersion?: string;
}
  