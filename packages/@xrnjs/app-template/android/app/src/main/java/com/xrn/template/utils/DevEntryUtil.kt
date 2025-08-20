package com.xrn.template.utils

import android.view.View
import android.view.WindowManager
import com.blankj.utilcode.util.ConvertUtils
import com.blankj.utilcode.util.ScreenUtils
import com.facebook.react.ReactActivity.WINDOW_SERVICE

object DevEntryUtil {

    private const val DISTANCE_ATTACH_SIDE = 20

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