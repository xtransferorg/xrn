package com.xrngo.multibundle.debug

import android.view.View
import android.view.WindowManager
import androidx.lifecycle.MutableLiveData
import com.blankj.utilcode.util.ConvertUtils
import com.blankj.utilcode.util.SPUtils
import com.blankj.utilcode.util.ScreenUtils
import com.facebook.react.ReactActivity.WINDOW_SERVICE

object XTDevTools {

    const val DEV_HOST_PREFIX = "api-sitxt"

    /**
     * SP 名，用于存储 dev_support 相关的数据
     */
    val SP_NAME_DEV_SUPPORT = "dev_support"

    private const val DISTANCE_ATTACH_SIDE = 20

    val isConnected = MutableLiveData<Boolean>(false)

    /**
     * 获取bundle对应的codePushKey
     * 如果有新增bundle，需要在这里添加代码
     */
    fun getCodePushKey(bundleName: String): String {
        var devCodePushKey = SPUtils.getInstance(SP_NAME_DEV_SUPPORT)
            .getString("${bundleName}-codepush-key", "")
        return devCodePushKey
    }

    /**
     * 获取开发环境数字
     */
    fun getDevApiHostNum(): String {
        val spEnvName =  SPUtils.getInstance().getString("DEV_ENV_NAME")
        val envName = if (spEnvName.isNullOrEmpty()) "" else spEnvName
        if ("prod" == envName) {
            return "线上"
        } else {

            val index = if (envName.contains(DEV_HOST_PREFIX)) {
                envName.indexOf(DEV_HOST_PREFIX) + DEV_HOST_PREFIX.length
            } else if (envName.contains("sitxt")) {
                envName.indexOf("sitxt") + 5
            } else if (envName.contains("dev")) {
                envName.indexOf("dev") + 3
            } else {
                -1
            }
            return if (index >= 0) {
                envName.substring(index)
            } else {
                "未知"
            }
        }
    }

    /**
     * 调试入口贴边
     */
    fun devEntryAttachSide(view: View?) {
        view ?: return
        val layoutParams = view.layoutParams as WindowManager.LayoutParams
        val originX = layoutParams.x
        if (originX < DISTANCE_ATTACH_SIDE) {
            layoutParams.x = originX - ConvertUtils.dp2px(25f)
        } else if (originX + ConvertUtils.dp2px(50f) + DISTANCE_ATTACH_SIDE > ScreenUtils.getScreenWidth()) {
            layoutParams.x = originX + ConvertUtils.dp2px(25f)
        }
        layoutParams.flags = layoutParams.flags or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        val windowManager = view.context.getSystemService(WINDOW_SERVICE) as WindowManager
        windowManager.updateViewLayout(view, layoutParams)
    }

}