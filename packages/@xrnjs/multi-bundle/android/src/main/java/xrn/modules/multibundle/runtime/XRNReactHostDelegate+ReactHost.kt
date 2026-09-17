package xrn.modules.multibundle.runtime

import android.content.Context
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.ReactHost
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.internal.bolts.Task
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.devsupport.XDevSupportManager
import java.util.concurrent.Executors

@OptIn(UnstableReactNativeAPI::class)
fun XRNReactHostDelegate.toReactHost(context: Context): XRNReactHostImpl {
    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)
    // TODO: T164788699 find alternative of accessing ReactHostImpl for initialising reactHost
    val reactHost = XRNReactHostImpl(
        context,
        this,
        componentFactory,
        Executors.newSingleThreadExecutor(),
        Task.UI_THREAD_EXECUTOR,
        true, /* allowPackagerServerAccess */
        this.getUseDeveloperSupport(),
        this.getDevSupportManagerFactory()
    )

    if (reactHost.devSupportManager is XDevSupportManager) {
        BundleInfoManager.getBundleInfo(this.bundleName)?.let { bundleInfo ->
            (reactHost.devSupportManager as XDevSupportManager).setReactHost(reactHost)
            (reactHost.devSupportManager as XDevSupportManager).setDebugServerHostPort(bundleInfo.getPort())
        }
    }

    return reactHost
}

fun ReactHost.getReactHostDelegate(): XRNReactHostDelegate {
    return ReflectUtils.reflect(this as ReactHostImpl)
        .field("mReactHostDelegate")
        .get()
}

