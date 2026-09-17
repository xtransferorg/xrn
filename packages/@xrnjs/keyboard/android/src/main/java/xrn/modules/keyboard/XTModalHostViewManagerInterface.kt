package xrn.modules.keyboard

import android.view.View
import com.facebook.react.viewmanagers.ModalHostViewManagerInterface

interface XTModalHostViewManagerInterface<T: View>: ModalHostViewManagerInterface<T> {

    /**
     * 设置软键盘模式
     * "resize" -> Dialog窗口重新计算高度
     * "pan" -> Dialog 窗口整体上浮
     */
    fun setSoftInputMode(view: T, softInputMode: String?)

    /**
     * 软键盘模式为 “pan” 时，输入法和输入框之间的间隔
     */
    fun setSpace(view: T, space: Int)

    /**
     * 设置可滚动的 View 的 tag
     */
    fun setScrollableViewTag(view: T, tag: String?)

    /**
     * 设置弹窗顶部距离屏幕的间隔
     * 0 & 正数是有效值
     * 负数表示整体上浮不受限制
     */
    fun setModalHeaderSpace(view: T, headerSpace: Int)
}