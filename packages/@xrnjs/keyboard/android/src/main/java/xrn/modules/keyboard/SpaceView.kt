package xrn.modules.keyboard

import android.content.Context
import android.view.View

/**
 * 用于 ScrollView 中填充滑动空间
 */
class SpaceView(context: Context): View(context) {

    var space = 0
        set(value) {
            field = if (value > 0) value else 0
        }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val widthSize = MeasureSpec.getSize(widthMeasureSpec)
        setMeasuredDimension(widthSize, space)
    }

}