package xrn.modules.multibundle.runtime

import android.app.Activity
import android.content.Context
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import java.lang.Exception
import java.util.concurrent.Executor

@OptIn(UnstableReactNativeAPI::class)
class XRNReactHostImpl(
    context: Context,
    delegate: ReactHostDelegate,
    componentFactory: ComponentFactory,
    bgExecutor: Executor,
    uiExecutor: Executor,
    allowPackagerServerAccess: Boolean,
    useDevSupport: Boolean,
    devSupportManagerFactory: DevSupportManagerFactory?
) : ReactHostImpl(
    context,
    delegate,
    componentFactory,
    bgExecutor,
    uiExecutor,
    allowPackagerServerAccess,
    useDevSupport,
    devSupportManagerFactory
) {

    val bundleName: String
        get() = getReactHostDelegate().bundleName

    var isFirstLoad = true

    override fun onHostResume(activity: Activity?) {
        super.onHostResume(activity)
        isFirstLoad = false
    }

    override fun destroy(reason: String, ex: Exception?): TaskInterface<Void> {
        isFirstLoad = true
        return super.destroy(reason, ex)
    }

}