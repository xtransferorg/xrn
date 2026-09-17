package xrn.modules.bundle

import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.Utils
import com.facebook.react.common.build.ReactBuildConfig
import com.microsoft.codepush.react.CodePush
import com.microsoft.codepush.react.CodePushUtils
import com.microsoft.codepush.react.DownloadProgress
import xrn.modules.bundle.utils.UiUtils
import xrn.modules.codepush.CodePushManager
import xrn.modules.codepush.DownloadProgressCallback
import xrn.modules.codepush.LocalPackage
import xrn.modules.codepush.RemotePackage
import xrn.modules.codepush.SyncOptions
import xrn.modules.codepush.SyncStatus
import xrn.modules.codepush.SyncStatusChangedCallback
import xrn.modules.codepush.sdk.PreFetchSdk
import xrn.modules.loading.LoadingManager
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.view.RNContainerActivity


object CodePushInstanceManager {

    interface CodePushMonitorCallback {
        fun onProgressShown(bundleName: String)

        fun onReportProgressShown()
    }

    private const val DEFAULT_CHECK_UPDATE_TIMEOUT_MILLIS = 2000
    private const val DEFAULT_STALE_TIME_MILLIS = 5 * 60 * 1000L
    val DEFAULT_ROLL_BACK_RETRY_OPTIONS = SyncOptions.RollbackRetryOptions(
        delayInHours = 24, maxRetryAttempts = 5
    )

    private val instanceMap by lazy { mutableMapOf<String, CodePushManager>() }

    private var codePushServerUrl = ""
    private var codePushPublicKeyResourceDescriptor = 0

    private var codePushMonitorCallback: CodePushMonitorCallback? = null

    fun init(
        serverUrl: String,
        publicKeyResourceDescriptor: Int,
        codePushMonitorCallback: CodePushMonitorCallback? = null
    ) {
        this.codePushServerUrl = serverUrl
        this.codePushPublicKeyResourceDescriptor = publicKeyResourceDescriptor
        this.codePushMonitorCallback = codePushMonitorCallback
    }

    fun getBizAssetsBundleFileName(bundleName: String): String {
        return "index.${bundleName}.bundle"
    }

    @Synchronized
    fun getOrCreate(
        bundleName: String,
        codePush: CodePush? = null,
        forceCreate: Boolean = false
    ): CodePushManager {
        val deploymentKey = getDeploymentKey(bundleName) ?: ""

        if (!instanceMap.contains(deploymentKey) || forceCreate) {
            val newCodePush = codePush
                ?: CodePush(
                    deploymentKey,
                    Utils.getApp(),
                    ReactBuildConfig.DEBUG,
                    codePushServerUrl,
                    codePushPublicKeyResourceDescriptor,
                )

            val mgr = CodePushManager(
                codePush = newCodePush
            ).apply { initialize(getBizAssetsBundleFileName(bundleName)) }
            instanceMap[deploymentKey] = mgr
        }

        return instanceMap.getValue(deploymentKey)
    }

    @Synchronized
    fun resetCodePushInstance(bundleName: String, codePush: CodePush) {
        val deploymentKey = getDeploymentKey(bundleName) ?: return
        codePush.resetDeploymentKey(deploymentKey)
        getOrCreate(bundleName).apply {
            this.codePush = codePush
            initialize(getBizAssetsBundleFileName(bundleName))
        }
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
                    SyncStatus.CHECKING_FOR_UPDATE -> Unit

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

                    SyncStatus.PACKAGE_DOWNLOADED -> Unit

                    SyncStatus.INSTALLING_UPDATE -> Unit

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

        val deploymentKey = getDeploymentKey(bundleName) ?: run {
            syncStatusChangedCallback.call(
                SyncStatus.UNKNOWN_ERROR, null, null,
                RuntimeException("$bundleName deploymentKey is null!")
            )
            return
        }
        val isMainBundle = BundleInfoManager.getBundleInfo(bundleName)?.isMainBundle() ?: false

        val downloadProgressCallback = object : DownloadProgressCallback {
            var isCurrentTaskReported = false

            override fun onProgress(downloadProgress: DownloadProgress) {
                val percent =
                    (downloadProgress.receivedBytes / downloadProgress.totalBytes.toDouble()) * 100

                CodePushUtils.log("Package download progress: ${percent.toInt()}%")

                if (!isMandatory || percent > 100) return

                /* 当前用户看到 Activity 为对应 bundle 才更新进度 */
                val topActivity = ActivityUtils.getTopActivity()
                if (topActivity is RNContainerActivity && topActivity.getBundleName() == bundleName) {
                    val updated = LoadingManager.updateProgress(
                        ActivityUtils.getTopActivity(),
                        percent.toInt(),
                        isMainBundle
                    )

                    if (updated && !isCurrentTaskReported) {
                        isCurrentTaskReported = true
                        codePushMonitorCallback?.onProgressShown(bundleName)
                    }
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
                            true,
                            DEFAULT_STALE_TIME_MILLIS,
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
            true,
            DEFAULT_STALE_TIME_MILLIS,
            syncStatusChangedCallback,
            downloadProgressCallback,
        )
    }

    fun preFetchUpdates() {
        try {
            val params = BundleInfoManager.getAllBundleInfo().map {
                val codePushManager = getOrCreate(it.bundleName)
                codePushManager.getConfigure() to codePushManager.getCurrentPackage()
            }

            PreFetchSdk.preFetchUpdates(params)
        } catch (e: Throwable) {
            LogUtils.e(e)
        }
    }

    fun batchPreDownload(vararg bundleName: String) {
        bundleName.forEach {
            preDownload(it)
        }
    }

    fun preDownload(bundleName: String) {
        val deploymentKey = getDeploymentKey(bundleName) ?: return

        getOrCreate(bundleName).preDownload(
            deploymentKey,
            SyncOptions(rollbackRetryOptions = DEFAULT_ROLL_BACK_RETRY_OPTIONS)
        )
    }

    fun reportProgressShown() {
        codePushMonitorCallback?.onReportProgressShown()
    }

    fun onJSBundleLoaded(bundleName: String, jsBundleFile: String) {
        getOrCreate(bundleName).getReactPackage().onJSBundleLoaded(jsBundleFile)
    }

    private fun getDeploymentKey(bundleName: String): String? {
        val bundleInfo = BundleInfoManager.getBundleInfo(bundleName) ?: return null
        return bundleInfo.getCodePushKey()
    }

}
