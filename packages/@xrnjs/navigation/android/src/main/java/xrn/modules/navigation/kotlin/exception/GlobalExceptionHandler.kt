package xrn.modules.navigation.kotlin.exception

import android.app.Activity
import com.blankj.utilcode.util.GsonUtils
import xrn.modules.navigation.kotlin.NavHelper.InitialProps

typealias NavigationExceptionHandler = (NavigationException) -> Unit

internal object GlobalExceptionHandler {

    private var exceptionHandler: NavigationExceptionHandler? = null

    fun setHandler(handler: NavigationExceptionHandler?) {
        exceptionHandler = handler
    }

    fun handleException(exception: NavigationException) {
        exceptionHandler?.invoke(exception)
    }

    fun onBundle404(
        activity: Activity,
        bundleName: String,
        moduleName: String? = null,
        initialProps: String? = null
    ) {
        val initialPropsObj =
            if (initialProps.isNullOrBlank()) {
                null
            } else {
                GsonUtils.fromJson(
                    initialProps,
                    InitialProps::class.java
                )
            }

        handleException(
            NavigationBundle404Exception.build(
                activity,
                bundleName,
                moduleName,
                initialPropsObj
            )
        )
    }

}