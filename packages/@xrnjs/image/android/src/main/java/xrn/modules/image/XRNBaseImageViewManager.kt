package xrn.modules.image

import android.view.View
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.yoga.YogaConstants

abstract class XRNBaseImageViewManager<T : View> : SimpleViewManager<T>() {

    private fun applyBorderRadius(view: T, prop: BorderRadiusProp, radius: Float) {
        val lengthPercentage = if (YogaConstants.isUndefined(radius)) null
            else LengthPercentage(radius, LengthPercentageType.POINT)
        BackgroundStyleApplicator.setBorderRadius(view, prop, lengthPercentage)
        view.clipToOutline = true
    }

    override fun setBorderRadius(view: T, borderRadius: Float) {
        applyBorderRadius(view, BorderRadiusProp.BORDER_RADIUS, borderRadius)
    }

    override fun setBorderTopLeftRadius(view: T, borderRadius: Float) {
        applyBorderRadius(view, BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, borderRadius)
    }

    override fun setBorderTopRightRadius(view: T, borderRadius: Float) {
        applyBorderRadius(view, BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS, borderRadius)
    }

    override fun setBorderBottomLeftRadius(view: T, borderRadius: Float) {
        applyBorderRadius(view, BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS, borderRadius)
    }

    override fun setBorderBottomRightRadius(view: T, borderRadius: Float) {
        applyBorderRadius(view, BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS, borderRadius)
    }

}