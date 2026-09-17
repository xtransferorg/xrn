import { common } from '@kit.AbilityKit'
import { BundleInfoManager } from '@xrnjs/multi-bundle/src/main/ets/bundle/BundleInfoManager'
import NativeCodePush, { getOrCreateNativeCodePush } from '@xrnjs/react-native-code-push/src/main/ets/nativeCodePush/NativeCodePush'
import {
  DEFAULT_ROLLBACK_RETRY_OPTIONS,
  UPDATE_CHECK_TIMEOUT
} from '@xrnjs/react-native-code-push/src/main/ets/nativeCodePush/NativeCodePushConstant'
import { RemotePackage } from '@xrnjs/react-native-code-push/src/main/ets/nativeCodePush/core/RemotePackage'
import { SyncOptions } from '@xrnjs/react-native-code-push/src/main/ets/nativeCodePush/NativeCodePushSyncOptions'

const TAG = "[PredownloadManager]"

export class PredownloadManager {
  
  static INSTANCE: PredownloadManager = new PredownloadManager()

  private context?: common.UIAbilityContext
  private serverUrl: string = ''
  private commonHash: string = ''

  private constructor() {
  }

  batchPredownload(
    context: common.UIAbilityContext,
    serverUrl: string,
    commonHash: string,
    bundles: string[]
  ): void {
    this.context = context
    this.serverUrl = serverUrl
    this.commonHash = commonHash

    console.log(TAG, `batchPredownload=start:${serverUrl}`)
    console.log(TAG, `batchPredownload=start:${commonHash}`)
    console.log(TAG, `batchPredownload=start:${bundles}`)
    
    for (let i = 0; i < bundles.length; i++) {
      const bundleName = bundles[i]
      console.log(TAG, `predownload=bundleName:${bundleName}`)
      this.preDownload(bundleName)
    }
  }

  preDownload(bundleName: string): void {
    const bundleInfo = this.getBundleInfo(bundleName)
    console.log(TAG, `predownload=bundleInfo:${JSON.stringify(bundleInfo)}`)

    const deploymentKey = bundleInfo?.getCodePushKey()
    console.log(TAG, `predownload=deploymentKey:${deploymentKey}`)

    if (!deploymentKey || !bundleInfo || !this.context) {
      console.log(TAG, `preDownload: invalid bundleInfo or context, bundleName=${bundleName}`)
      return
    }

    console.log(TAG, `predownload=创建codepush前:${bundleName}`)
    const nativeCodePush = getOrCreateNativeCodePush(
      this.context,
      bundleInfo,
      this.serverUrl,
      this.commonHash
    )
    console.log(TAG, `predownload=创建codepush后:${nativeCodePush}`)
    
    if (nativeCodePush) {
      nativeCodePush.checkAndDownload(
        this.getSyncOptions(bundleName),
        true,
        (syncStatus: number, remotePackage: RemotePackage, error: Error) => {
          console.log(TAG, `predownload=statusChangeCallback:${syncStatus}`)
        }, ({ updatePackage, totalBytes, receivedBytes }) => {
          console.log(TAG, `predownload=progressCallback:`)
        }, () => {
          console.log(TAG, `predownload=MismatchCallback:`)
        })
    }
  }
  
  getBundleInfo(bundleName) {
    let bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
    return bundleInfo
  }
  
  getSyncOptions(bundleName: string): SyncOptions {
    return {
      bundleName: bundleName,
      rollbackRetryOptions: DEFAULT_ROLLBACK_RETRY_OPTIONS,
      updateCheckHttpTimeoutOptions: UPDATE_CHECK_TIMEOUT
    }
  }
}
