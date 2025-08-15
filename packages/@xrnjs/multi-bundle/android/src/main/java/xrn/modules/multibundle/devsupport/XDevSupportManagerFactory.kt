package xrn.modules.multibundle.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.DisabledDevSupportManager
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

/**
 * Factory class responsible for creating instances of XDevSupportManager
 * associated with the specified bundle name.
 *
 * @property bundleName The name of the JS bundle for which the support manager is created.
 */
open class XDevSupportManagerFactory(val bundleName: String): DevSupportManagerFactory {


    override fun create(
        applicationContext: Context,
        reactInstanceManagerHelper: ReactInstanceDevHelper?,
        packagerPathForJSBundleName: String?,
        enableOnCreate: Boolean,
        redBoxHandler: RedBoxHandler?,
        devBundleDownloadListener: DevBundleDownloadListener?,
        minNumShakes: Int,
        customPackagerCommandHandlers: Map<String?, RequestHandler?>?,
        surfaceDelegateFactory: SurfaceDelegateFactory?,
        devLoadingViewManager: DevLoadingViewManager?
    ): DevSupportManager? {
        return if (!enableOnCreate) {
            DisabledDevSupportManager()
        } else {
            createXDevSupportManager(
                this.bundleName,
                applicationContext,
                reactInstanceManagerHelper,
                packagerPathForJSBundleName,
                true,
                redBoxHandler,
                devBundleDownloadListener,
                minNumShakes,
                customPackagerCommandHandlers,
                surfaceDelegateFactory,
                devLoadingViewManager
            )
        }
    }

    protected open fun createXDevSupportManager(bundleName: String, applicationContext: Context,
                                           reactInstanceManagerHelper: ReactInstanceDevHelper?,
                                           packagerPathForJSBundleName: String?,
                                           enableOnCreate: Boolean,
                                           redBoxHandler: RedBoxHandler?,
                                           devBundleDownloadListener: DevBundleDownloadListener?,
                                           minNumShakes: Int,
                                           customPackagerCommandHandlers: Map<String?, RequestHandler?>?,
                                           surfaceDelegateFactory: SurfaceDelegateFactory?,
                                           devLoadingViewManager: DevLoadingViewManager?): XDevSupportManager {
        return XDevSupportManager(
            this.bundleName,
            applicationContext,
            reactInstanceManagerHelper,
            packagerPathForJSBundleName,
            true,
            redBoxHandler,
            devBundleDownloadListener,
            minNumShakes,
            customPackagerCommandHandlers,
            surfaceDelegateFactory,
            devLoadingViewManager
        )
    }
}