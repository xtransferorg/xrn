package xrn.modules.multibundle.defaults

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.internal.bolts.Task
import xrn.modules.multibundle.runtime.XRNReactHostDelegate
import java.util.concurrent.Executors


object XRNDefaultReactHost {

    @OptIn(UnstableReactNativeAPI::class)
    fun getDefaultReactHost(
        context: Context,
        hostDelegate: XRNReactHostDelegate
    ): ReactHost {
        val componentFactory = ComponentFactory()
        DefaultComponentsRegistry.register(componentFactory)
        // TODO: T164788699 find alternative of accessing ReactHostImpl for initialising reactHost
        return ReactHostImpl(
            context,
            hostDelegate,
            componentFactory,
            Executors.newSingleThreadExecutor(),
            Task.UI_THREAD_EXECUTOR,
            true, /* allowPackagerServerAccess */
            hostDelegate.getUseDeveloperSupport(),
            hostDelegate.getDevSupportManagerFactory()
        )
    }

}