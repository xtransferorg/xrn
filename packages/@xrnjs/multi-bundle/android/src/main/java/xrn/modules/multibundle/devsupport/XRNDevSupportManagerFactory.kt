package xrn.modules.multibundle.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

open class XRNDevSupportManagerFactory(val bundleName: String) : DevSupportManagerFactory {

    override fun create(
        applicationContext: Context,
        reactInstanceDevHelper: ReactInstanceDevHelper,
        packagerPathForJSBundleName: String?,
        enableOnCreate: Boolean,
        redBoxHandler: RedBoxHandler?,
        devBundleDownloadListener: DevBundleDownloadListener?,
        minNumShakes: Int,
        customPackagerCommandHandlers: Map<String, RequestHandler>?,
        surfaceDelegateFactory: SurfaceDelegateFactory?,
        devLoadingViewManager: DevLoadingViewManager?,
        pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
    ): DevSupportManager =
        if (!enableOnCreate) {
            ReleaseDevSupportManager()
        } else {
            XDevSupportManager(
                bundleName,
                applicationContext,
                reactInstanceDevHelper,
                packagerPathForJSBundleName,
                enableOnCreate,
                redBoxHandler,
                devBundleDownloadListener,
                minNumShakes,
                customPackagerCommandHandlers,
                surfaceDelegateFactory,
                devLoadingViewManager,
                pausedInDebuggerOverlayManager
            )
        }

    override fun create(
        applicationContext: Context,
        reactInstanceManagerHelper: ReactInstanceDevHelper,
        packagerPathForJSBundleName: String?,
        enableOnCreate: Boolean,
        redBoxHandler: RedBoxHandler?,
        devBundleDownloadListener: DevBundleDownloadListener?,
        minNumShakes: Int,
        customPackagerCommandHandlers: MutableMap<String, RequestHandler>?,
        surfaceDelegateFactory: SurfaceDelegateFactory?,
        devLoadingViewManager: DevLoadingViewManager?,
        pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
        useDevSupport: Boolean
    ): DevSupportManager =
        if (!useDevSupport) {
            ReleaseDevSupportManager()
        } else {
            // TODO
            XDevSupportManager(
                bundleName,
                applicationContext,
                reactInstanceManagerHelper,
                packagerPathForJSBundleName,
                enableOnCreate,
                redBoxHandler,
                devBundleDownloadListener,
                minNumShakes,
                customPackagerCommandHandlers,
                surfaceDelegateFactory,
                devLoadingViewManager,
                pausedInDebuggerOverlayManager
            )
            // ReleaseDevSupportManager()
//            BridgelessDevSupportManager(
//                applicationContext,
//                reactInstanceManagerHelper,
//                packagerPathForJSBundleName,
//                enableOnCreate,
//                redBoxHandler,
//                devBundleDownloadListener,
//                minNumShakes,
//                customPackagerCommandHandlers,
//                surfaceDelegateFactory,
//                devLoadingViewManager,
//                pausedInDebuggerOverlayManager
//            )
        }

}