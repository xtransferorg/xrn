package xrn.modules.keyboard

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.modal.ReactModalHostManager
import com.facebook.react.views.modal.ReactModalHostView


@ReactModule(name = "RCTModalHostView")
class XTModalHostViewManager: ReactModalHostManager(), XTModalHostViewManagerInterface<ReactModalHostView> {

    private val mXTModalHostViewManagerDelegate = XTModalHostViewManagerDelegate(this)

    override fun createViewInstance(p0: ThemedReactContext): ReactModalHostView {
        return XTModalHostView(p0)
    }

    override fun onAfterUpdateTransaction(view: ReactModalHostView) {
        super.onAfterUpdateTransaction(view)
    }

    /**
     * 新增 JS 属性 space
     */
    @ReactProp(name = "softInputMode")
    override fun setSoftInputMode(view: ReactModalHostView, mode: String?) {
        (view as? XTModalHostView)?.setSoftInputMode(mode)
    }

    /**
     * 新增 JS 属性 space
     */
    @ReactProp(name = "space")
    override fun setSpace(view: ReactModalHostView, space: Int) {
        (view as? XTModalHostView)?.setSpace(space)
    }

    @ReactProp(name = "scrollableViewTag")
    override fun setScrollableViewTag(view: ReactModalHostView, tag: String?) {
        (view as? XTModalHostView)?.setScrollableViewTag(tag)
    }

    @ReactProp(name = "modalHeaderSpace")
    override fun setModalHeaderSpace(view: ReactModalHostView, headerSpace: Int) {
        (view as? XTModalHostView)?.setModalHeaderSpace(headerSpace)
    }

    override fun updateProperties(viewToUpdate: ReactModalHostView, props: ReactStylesDiffMap?) {
        super.updateProperties(viewToUpdate, props)
    }

    override fun getDelegate(): ViewManagerDelegate<ReactModalHostView> {
        return mXTModalHostViewManagerDelegate
    }

}