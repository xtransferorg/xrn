package xrn.modules.debugtools.action

import android.app.Activity
import com.blankj.utilcode.util.AppUtils
import xrn.modules.multibundle.devsupport.XDevInternalSettings

class SwitchBundleDebugAction(val activity: Activity, val bundleName: String) : IAction {
    var mDevSettings: XDevInternalSettings = XDevInternalSettings(
        bundleName, activity.applicationContext
    ) {
        AppUtils.relaunchApp(true)
    }


    override fun name(): String {
        return if (mDevSettings.isBundleDebugEnabled()) "关闭bundle调试" else "打开bundle调试"
    }

    override fun scope(): Int {
        return IAction.SCOPE_DEV_DEBUG.or(IAction.SCOPE_DEV_RELEASE)
    }

    override fun doAction() {
        mDevSettings.setBundleDebugEnabled(!mDevSettings.isBundleDebugEnabled())
        AppUtils.relaunchApp(true)
    }


}