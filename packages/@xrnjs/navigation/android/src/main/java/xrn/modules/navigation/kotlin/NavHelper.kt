package xrn.modules.navigation.kotlin

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.LogUtils
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.view.RNContainerActivity
import xrn.modules.navigation.kotlin.exception.GlobalExceptionHandler


object NavHelper {

    private const val INITIAL_PROPS_PARAMS = "params"

    var activityClazzFactory: RNContainerActivityClazzFactory? = null

    private fun buildModuleParams(
        bundleName: String,
        moduleName: String? = null,
        initialProps: String? = null
    ): Bundle {
        return Bundle().apply {
            putString(RNContainerActivity.BUNDLE_NAME_PARAMS, bundleName)
            putString(
                RNContainerActivity.MODULE_NAME_PARAMS,
                if (moduleName.isNullOrBlank()) bundleName else moduleName
            )
            if (!initialProps.isNullOrBlank()) {
                putString(INITIAL_PROPS_PARAMS, initialProps)
            }
        }
    }

    fun buildIntent(
        activity: Activity,
        bundleName: String,
        moduleName: String? = null,
        initialProps: String? = null
    ): Intent? {
        if (activityClazzFactory == null) {
            LogUtils.e("[XRN][Navigation] You should set activityClazzFactory first.")
            return null
        }

        val bundleInfo = BundleInfoManager.getBundleInfo(bundleName)

        if (bundleInfo == null) {
            GlobalExceptionHandler.onBundle404(
                activity,
                bundleName,
                moduleName,
                initialProps
            )

            return null
        }

        val clazz = activityClazzFactory!!.get(bundleInfo.bundleType)

        val intent = Intent(activity, clazz)

        val moduleParams = buildModuleParams(bundleName, moduleName, initialProps)

        intent.putExtra(RNContainerActivity.BUNDLE_PARAMS, moduleParams)

        return intent
    }

    fun buildIntent(
        activity: Activity,
        bundleName: String,
        moduleName: String? = null,
        initialProps: InitialProps? = null
    ): Intent? {
        val initialPropsObj = initialProps?.let {
            GsonUtils.toJson(it)
        }

        return buildIntent(
            activity,
            bundleName,
            moduleName,
            initialPropsObj
        )
    }

    fun buildMainModuleIntent(activity: Activity, initialProps: InitialProps? = null): Intent? {
        val mainBundleInfo = BundleInfoManager.getMainBundleInfo() ?: return null

        return buildIntent(activity, mainBundleInfo.bundleName, null, initialProps)
    }

    fun jump2Module(
        activity: Activity?,
        bundleName: String,
        moduleName: String? = null,
        initialProps: InitialProps? = null
    ): Boolean {
        if (activity == null) return false

        val intent = buildIntent(activity, bundleName, moduleName, initialProps) ?: return false

        activity.startActivity(intent)

        return true
    }

    fun jump2Module(
        activity: Activity?,
        bundleName: String,
        moduleName: String? = null,
        initialProps: String? = null
    ): Boolean {
        if (activity == null) return false

        val intent = buildIntent(activity, bundleName, moduleName, initialProps) ?: return false

        activity.startActivity(intent)

        return true
    }

    data class ModuleInitialPayload(
        val bundleName: String,
        val moduleName: String? = null,
        val initialProps: InitialProps? = null
    )

    data class InitialProps(
        val initialRouteName: String? = null,
        val initialRouteParams: Map<String, Any>? = null,
        val initialState: String? = null
    )

}