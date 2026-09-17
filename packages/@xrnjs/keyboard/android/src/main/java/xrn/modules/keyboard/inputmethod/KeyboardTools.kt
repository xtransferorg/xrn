package xrn.modules.keyboard.inputmethod

import android.content.Context
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.views.scroll.ReactScrollView
import xrn.modules.keyboard.Constants
import xrn.modules.keyboard.R
import xrn.modules.keyboard.inputmethod.handler.AmountKeyboardHandler
import xrn.modules.keyboard.inputmethod.handler.IKeyboardTypeHandler

object KeyboardTools {
    /**
     * 生成 Keyboard
     */
    fun createKeyboard(context: Context, keyboardType: String): Keyboard? {
        return when(keyboardType) {
            KEYBOARD_TYPE_AMOUNT -> Keyboard(context, R.xml.xt_keyboard_amount)
            else -> null
        }
    }

    /**
     * 生成 IKeyboardTypeHandler
     */
    fun createKeyboardTypeHandler(context: Context, keyboardType: String): IKeyboardTypeHandler? {
        return when(keyboardType) {
            KEYBOARD_TYPE_AMOUNT -> AmountKeyboardHandler(context)
            else -> null
        }
    }

    /**
     * 获取 nativeID
     */
    private fun getNativeId(view: View?): String? {
        val tag = view?.getTag(com.facebook.react.R.id.view_tag_native_id)
        return if (tag is String) tag else null
    }

    /**
     * 查找可滚动组件（从内向外，最后面的一个可滚动组件）
     */
    fun findScrollableView(focusView: View?): ReactScrollView? {
        if (focusView == null) {
            return null
        }
        //从当前输入框向外找，最后一个 ReactScrollView
        var curView: View? = focusView
        var scrollView: ReactScrollView? = null
        while (curView != null) {
            if (curView is ReactScrollView) {
                scrollView = curView
                val nativeID = getNativeId(scrollView)
                if (nativeID == Constants.NATIVE_ID_KEYBOARD_SCROLLABLE_VIEW_TAG) {
                    //如果 nativeID 匹配，就判定为可滚动组件；
                    return scrollView
                }
            }
            curView = curView.parent as? View
        }
        // nativeID 没匹配到，就判定为最外层的 ReactScrollView 为可滚动组件；
        return scrollView
    }


    /**
     * 底部虚拟导航栏高度
     */
    fun getBottomNavigatorBarHeight(window: Window?): Int {

        val finalNavigatorHeight = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val insets = window?.decorView?.rootWindowInsets ?: return 0
            val navInsets = insets.getInsets(WindowInsets.Type.navigationBars())
            val isVisible = insets.isVisible(WindowInsets.Type.navigationBars())
            if (isVisible) navInsets.bottom else 0
        } else {
            val navigatorHeight = window?.decorView?.let {
                val insets = ViewCompat.getRootWindowInsets(it)
                val navBarInsets = insets?.getInsets(WindowInsetsCompat.Type.navigationBars())
                navBarInsets?.bottom ?: 0
            } ?: run {
                0
            }
            navigatorHeight
        }
        return finalNavigatorHeight
    }

}