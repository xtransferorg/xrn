package com.xrngo.navigation

import android.os.Bundle
import android.view.Gravity
import android.widget.TextView
import com.blankj.utilcode.util.ConvertUtils
import com.blankj.utilcode.util.ToastUtils
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.lzf.easyfloat.EasyFloat
import com.lzf.easyfloat.enums.ShowPattern
import com.lzf.easyfloat.enums.SidePattern
import com.xrngo.R
import com.xrngo.utils.DevEntryUtil
import com.xrngo.utils.LifecycleAwareRunnable
import xrn.modules.navigation.kotlin.BaseRNContainerActivity

open class XGoBundleActivity:BaseRNContainerActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        if (mBundleName.isBlank() || mModuleName.isBlank()) {
            ToastUtils.showShort("RN容器初始化失败、bundleName或moduleName不允许为空")
            finish()
            return
        }

        val drawable = resources.getDrawable(R.drawable.bg_debug_entry)
        val builder = EasyFloat.with(this).setLayout(R.layout.layout_rn_dev_float)
            .setShowPattern(ShowPattern.CURRENT_ACTIVITY)
            .setSidePattern(SidePattern.DEFAULT)
            .setGravity(Gravity.RIGHT, 0, ConvertUtils.dp2px(100f))
            .setTag(this@XGoBundleActivity.toString())
            .registerCallback {
                createResult { isCreated, msg, view ->
                    view?.setOnClickListener {
                        getRNHost()?.reactInstanceManager?.currentReactContext?.getJSModule(
                            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("NATIVE_FLOAT_BAR_CLICK", null)
                    }
                    view?.background = drawable
                    val runnable = LifecycleAwareRunnable(lifecycle) { DevEntryUtil.devEntryAttachSide(view) }
                    LifecycleAwareRunnable.getHandler().postDelayed(runnable, 500)
                }

                touchEvent { view, motionEvent ->
                    drawable?.state = intArrayOf(android.R.attr.state_checked)
                }

                dragEnd { view ->
                    DevEntryUtil.devEntryAttachSide(view)
                    drawable?.state = intArrayOf()
                }

            }
        builder.show()
    }
}