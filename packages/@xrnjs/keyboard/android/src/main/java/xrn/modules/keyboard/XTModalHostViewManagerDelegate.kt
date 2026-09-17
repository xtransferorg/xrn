package xrn.modules.keyboard

import android.view.View
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.viewmanagers.ModalHostViewManagerDelegate

class XTModalHostViewManagerDelegate<T: View, U>(manager: U) : ModalHostViewManagerDelegate<T, U>(manager) where U: BaseViewManager<T, *>, U: XTModalHostViewManagerInterface<T> {

    override fun setProperty(view: T, propName: String?, value: Any?) {
        when(propName) {
            "softInputMode" -> {
                (mViewManager as? XTModalHostViewManagerInterface<T>)?.setSoftInputMode(view, value as? String)
            }
            "space" -> {
                (mViewManager as? XTModalHostViewManagerInterface<T>)?.setSpace(view, (value as? Number)?.toInt() ?: 0)
            }
            "scrollableViewTag" -> {
                (mViewManager as? XTModalHostViewManagerInterface<T>)?.setScrollableViewTag(view, value as? String)
            }
            "modalHeaderSpace" -> {
                (mViewManager as? XTModalHostViewManagerInterface<T>)?.setModalHeaderSpace(view, (value as? Number)?.toInt() ?: -1)
            }
            else -> {
                super.setProperty(view, propName, value)
            }
        }
    }
}