package com.xrngo.multibundle

import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.Utils
import com.microsoft.codepush.react.CodePush
import com.microsoft.codepush.react.CodePushUtils
import com.microsoft.codepush.react.DownloadProgress
import com.xrngo.BuildConfig
import com.xrngo.R
import com.xrngo.utils.UiUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import xrn.modules.codepush.CodePushManager
import xrn.modules.codepush.DownloadProgressCallback
import xrn.modules.codepush.LocalPackage
import xrn.modules.codepush.RemotePackage
import xrn.modules.codepush.SyncOptions
import xrn.modules.codepush.SyncStatus
import xrn.modules.codepush.SyncStatusChangedCallback
import xrn.modules.loading.LoadingManager
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.view.RNContainerActivity


object CodePushUtils {

    private const val DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS = 2000
    val DEFAULT_ROLL_BACK_RETRY_OPTIONS = SyncOptions.RollbackRetryOptions(
        delayInHours = 24, maxRetryAttempts = 5
    )

    private val instanceMap by lazy { mutableMapOf<String, CodePushManager>() }

    fun getOrCreate(
        bundleName: String,
        codePush: CodePush? = null,
        forceCreate: Boolean = false
    ): CodePushManager {
        val deploymentKey = getDeploymentKey(bundleName)

        if (!instanceMap.contains(deploymentKey) || forceCreate) {
            val newCodePush = codePush
                ?: CodePush(
                    deploymentKey,
                    Utils.getApp(),
                    BuildConfig.DEBUG,
                    BuildConfig.CODEPUSH_URL,
                    R.string.codepush_public_key,
                )

            val mgr = CodePushManager(
                codePush = newCodePush
            ).apply { initialize(XGoBundleTool.getBizAssetsBundleFileName(bundleName)) }
            instanceMap[deploymentKey] = mgr
        }

        return instanceMap.getValue(deploymentKey)
    }

    fun syncUpdate(
        bundleName: String,
        codePushManager: CodePushManager = getOrCreate(bundleName),
        checkUpdateTimeoutMillis: Int = DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS,
        syncOptions: SyncOptions = SyncOptions(rollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS),
        completedCallback: (() -> Unit)? = null,
    ) {
        var isInvoked = false

        fun oneTimeCompletedCallback() {
            if (isInvoked) return
            isInvoked = true

            completedCallback?.invoke()
        }

        var retryCallback: (() -> Unit)? = null

        var isMandatory = true

        val syncStatusChangedCallback = object : SyncStatusChangedCallback {
            override fun call(
                status: SyncStatus,
                remotePackage: RemotePackage?,
                localPackage: LocalPackage?,
                e: Throwable?
            ) {
                when (status) {
                    SyncStatus.UP_TO_DATE -> {
                        oneTimeCompletedCallback()
                    }

                    SyncStatus.DOWNLOADING_PACKAGE -> {
                        if (remotePackage != null) {
                            isMandatory = remotePackage.isMandatory

                            if (!isMandatory) {
                                oneTimeCompletedCallback()
                            }
                        }
                    }

                    SyncStatus.UPDATE_INSTALLED -> {
                        oneTimeCompletedCallback()
                    }

                    SyncStatus.PATCH_ERROR -> if (e != null) LogUtils.e(e)

                    SyncStatus.UNKNOWN_ERROR -> {
                        if (e != null) LogUtils.e(e)

                        if (retryCallback != null) {
                            retryCallback?.invoke()
                        } else {
                            oneTimeCompletedCallback()
                        }
                    }

                    else -> {}
                }
            }
        }

        val isMainBundle = BundleInfoManager.getBundleInfo(bundleName)?.isMainBundle() ?: false
        val deploymentKey = getDeploymentKey(bundleName)

        val downloadProgressCallback = object : DownloadProgressCallback {
            override fun onProgress(downloadProgress: DownloadProgress) {
                val percent =
                    (downloadProgress.receivedBytes / downloadProgress.totalBytes.toDouble()) * 100

                CodePushUtils.log("Package download progress: ${percent.toInt()}%")

                if (!isMandatory || percent > 100) return

                /* 当前用户看到 Activity 为对应 bundle 才更新进度 */
                val topActivity = ActivityUtils.getTopActivity()
                if (topActivity is RNContainerActivity && topActivity.getBundleName() == bundleName) {
                    LoadingManager.updateProgress(
                        ActivityUtils.getTopActivity(),
                        percent.toInt(),
                        isMainBundle
                    )
                    return
                }
            }
        }

        retryCallback = if (codePushManager.getReactPackage().isBinaryJSBundleFileExists) {
            null
        } else {
            {
                LoadingManager.showErrorBoundary(
                    ActivityUtils.getTopActivity(),
                    UiUtils.networkErrorText,
                    UiUtils.retryText,
                    {
                        LoadingManager.hideErrorBoundary()

                        codePushManager.sync(
                            deploymentKey,
                            syncOptions,
                            checkUpdateTimeoutMillis,
                            false,
                            null,
                            syncStatusChangedCallback,
                            downloadProgressCallback,
                        )
                    },
                    {
                        val topActivity = ActivityUtils.getTopActivity()
                        if (topActivity is RNContainerActivity && topActivity.getBundleName() == bundleName) {
                            topActivity.reactHost.destroy("", null)
                            topActivity.finish()
                        }
                    }
                )
            }
        }

        codePushManager.sync(
            deploymentKey,
            syncOptions,
            checkUpdateTimeoutMillis,
            false,
            null,
            syncStatusChangedCallback,
            downloadProgressCallback,
        )
    }

    fun syncUpdateAsynchronously(
        bundleName: String,
        checkUpdateTimeoutMillis: Int = DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS,
        rollbackRetryOptions: SyncOptions.RollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS,
        completedCallback: (() -> Unit)? = null,
    ) {
        syncUpdateAsynchronously(
            bundleName,
            getOrCreate(bundleName),
            checkUpdateTimeoutMillis,
            rollbackRetryOptions,
            completedCallback
        )
    }

    fun syncUpdateAsynchronously(
        bundleName: String,
        codePushManager: CodePushManager,
        checkUpdateTimeoutMillis: Int = DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS,
        rollbackRetryOptions: SyncOptions.RollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS,
        completedCallback: (() -> Unit)? = null,
    ) {
        CoroutineScope(Dispatchers.Main).launch {
            withContext(Dispatchers.IO) {
                syncUpdate(
                    bundleName,
                    codePushManager,
                    checkUpdateTimeoutMillis,
                    SyncOptions(rollbackRetryOptions = rollbackRetryOptions),
                    completedCallback
                )
            }
        }
    }

    fun syncUpdateSilently(
        bundleName: String,
        checkUpdateTimeoutMillis: Int = DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS,
        rollbackRetryOptions: SyncOptions.RollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS,
    ) {
        syncUpdateSilently(
            bundleName,
            getOrCreate(bundleName), checkUpdateTimeoutMillis, rollbackRetryOptions
        )
    }

    fun syncUpdateSilently(
        bundleName: String,
        codePushManager: CodePushManager,
        checkUpdateTimeoutMillis: Int = DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS,
        rollbackRetryOptions: SyncOptions.RollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS,
    ) {
        syncUpdate(
            bundleName,
            codePushManager,
            checkUpdateTimeoutMillis,
            SyncOptions(rollbackRetryOptions = rollbackRetryOptions),
            null
        )
    }

    fun onJSBundleLoaded(bundleName: String, jsBundleFile: String) {
        getOrCreate(bundleName).getReactPackage().onJSBundleLoaded(jsBundleFile)
    }

    private fun getDeploymentKey(bundleName: String): String {
        val bundleInfo = BundleInfoManager.getBundleInfo(bundleName) ?: return ""
        return bundleInfo.getCodePushKey()
    }

}
