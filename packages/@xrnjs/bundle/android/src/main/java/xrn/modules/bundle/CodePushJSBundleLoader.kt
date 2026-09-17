package xrn.modules.bundle

import android.app.Application
import com.facebook.react.bridge.JSBundleLoaderDelegate
import com.microsoft.codepush.react.CodePushInstallMode
import xrn.modules.codepush.SyncOptions
import xrn.modules.multibundle.runtime.XRNJSBundleLoader
import xrn.modules.multibundle.runtime.JSBundleFileHolder
import xrn.modules.multibundle.runtime.JSBundleType
import java.util.concurrent.CountDownLatch

open class CodePushJSBundleLoader(
    override val application: Application,
    override var bundleName: String,
    override var loadCommonOnly: Boolean,
    override val jsBundleFileHolder: JSBundleFileHolder
) : XRNJSBundleLoader(
    application,
    bundleName,
    loadCommonOnly,
    jsBundleFileHolder,
) {
    private var isUpdateSynced = false

    override fun loadCommonBundle(delegate: JSBundleLoaderDelegate): String {
        if (loadCommonOnly || bundleName.isBlank()) {
            isUpdateSynced = false
            super.loadCommonBundle(delegate)
        } else {
            isUpdateSynced = true
            val countDownLatch = CountDownLatch(2)

            Thread {
                CodePushInstanceManager.syncUpdate(
                    bundleName,
                    syncOptions = SyncOptions(
                        mandatoryInstallMode = CodePushInstallMode.ON_NEXT_RESTART,
                        rollbackRetryOptions = CodePushInstanceManager.DEFAULT_ROLL_BACK_RETRY_OPTIONS
                    )
                ) {
                    countDownLatch.countDown()
                }
            }.start()

            Thread {
                super.loadCommonBundle(delegate)
                countDownLatch.countDown()
            }.start()

            countDownLatch.await()
        }

        return getBundleFile(JSBundleType.COMMON)
    }

    override fun loadBizBundle(delegate: JSBundleLoaderDelegate): String {
        if (!isUpdateSynced && bundleName.isNotBlank()) {
            val countDownLatch = CountDownLatch(1)

            CodePushInstanceManager.syncUpdate(bundleName) {
                countDownLatch.countDown()
            }

            countDownLatch.await()
        }

        /*
        * 加载业务 Bundle 前执行 initializeUpdateAfterRestart。index.js 执行完调用 notifyAppReady。
        * */
        CodePushInstanceManager.getOrCreate(bundleName).codePush.initializeUpdateAfterRestart()
        val sourceUrl = super.loadBizBundle(delegate)
        CodePushInstanceManager.onJSBundleLoaded(bundleName, sourceUrl)
        return sourceUrl
    }

}