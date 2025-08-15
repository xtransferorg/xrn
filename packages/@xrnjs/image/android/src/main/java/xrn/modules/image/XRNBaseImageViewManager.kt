package xrn.modules.image

import android.util.Log
import android.view.View
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.yoga.YogaConstants

abstract class XRNBaseImageViewManager<T : View> : SimpleViewManager<T>() {

    open fun setBorderColorInternal(view: T, index: Int, color: Int?) {

    }

    @ReactPropGroup(
        names = [
            ViewProps.BORDER_COLOR,
            ViewProps.BORDER_LEFT_COLOR,
            ViewProps.BORDER_RIGHT_COLOR,
            ViewProps.BORDER_TOP_COLOR,
            ViewProps.BORDER_BOTTOM_COLOR,
            ViewProps.BORDER_START_COLOR,
            ViewProps.BORDER_END_COLOR
        ],
        customType = "Color"
    )
    fun setBorderColor(view: T, index: Int, color: Int) {
        Log.e(
            "lhy",
            "setBorderColor: $index color: $color ${color} ${
                LogicalEdge.fromSpacingType(index).toSpacingType()
            }  ${LogicalEdge.values()[index].toSpacingType()}"
        )

        setBorderColorInternal(
            view,
            LogicalEdge.values()[index].toSpacingType(),
            color
        )
    }

    open fun setBorderWidthInternal(view: T, index: Int, width: Float) {

    }

    @ReactPropGroup(
        names = [
            ViewProps.BORDER_WIDTH,
            ViewProps.BORDER_LEFT_WIDTH,
            ViewProps.BORDER_RIGHT_WIDTH,
            ViewProps.BORDER_TOP_WIDTH,
            ViewProps.BORDER_BOTTOM_WIDTH,
            ViewProps.BORDER_START_WIDTH,
            ViewProps.BORDER_END_WIDTH
        ],
        defaultFloat = Float.NaN
    )
    fun setBorderWidth(view: T, index: Int, width: Float) {
        var realWidth = width
        if (!YogaConstants.isUndefined(realWidth)) {
            realWidth = PixelUtil.toPixelFromDIP(realWidth)
        }

        setBorderWidthInternal(view, LogicalEdge.values()[index].toSpacingType(), realWidth)
    }

    open fun setBorderStyleInternal(view: T, style: String?) {

    }

    @ReactProp(name = "borderStyle")
    fun setBorderStyle(view: T, style: String?) {
        setBorderStyleInternal(view, style)
    }

    open fun setBorderRadiusInternal(view: T, index: Int, radius: Float) {

    }

    @ReactPropGroup(
        names = [ViewProps.BORDER_RADIUS,
            ViewProps.BORDER_TOP_LEFT_RADIUS,
            ViewProps.BORDER_TOP_RIGHT_RADIUS,
            ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
            ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
            ViewProps.BORDER_TOP_START_RADIUS,
            ViewProps.BORDER_TOP_END_RADIUS,
            ViewProps.BORDER_BOTTOM_START_RADIUS,
            ViewProps.BORDER_BOTTOM_END_RADIUS,
            /*ViewProps.BORDER_END_END_RADIUS,
            ViewProps.BORDER_END_START_RADIUS,
            ViewProps.BORDER_START_END_RADIUS,
            ViewProps.BORDER_START_START_RADIUS*/]
    )
    fun setBorderRadius(view: T, index: Int, radius: Float) {
        setBorderRadiusInternal(view, index, radius)
    }

}