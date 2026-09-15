package xrn.modules.keyboard.inputmethod

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.ScrollView
import xrn.modules.keyboard.R
import com.blankj.utilcode.util.BarUtils
import com.blankj.utilcode.util.ScreenUtils
import com.blankj.utilcode.util.SizeUtils
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.textinput.ReactEditText
import xrn.modules.keyboard.Constants
import xrn.modules.keyboard.SpaceView
import xrn.modules.keyboard.XRNKeyboardModule
import xrn.modules.keyboard.XTModalHostView
import xrn.modules.keyboard.inputmethod.KeyboardTools.getBottomNavigatorBarHeight
import xrn.modules.keyboard.inputmethod.handler.IKeyboardTypeHandler

class KeyboardContainer: LinearLayout {

    /**
     * KeyboardView
     */
    val keyboardView: KeyboardView

    /**
     * 当前输入框
     */
    var curEditView: ReactEditText? = null
        private set

    /**
     * 当前所属的 ModalHostView
     * 如果为 null，说明输入框属于 Activity
     */
    var curModalHostView: XTModalHostView? = null

    /**
     * 当前所属 Activity 时
     */
    var curKeyboardModule: XRNKeyboardModule? = null
    /**
     * 当前输入框所属的可滚动 View
     * 用于滚动，以露出输入框
     */
    var curScrollView: ScrollView? = null
        private set

    /**
     * 有效视图根View
     * 用于 Dialog 向上浮动，根视图有最大上浮限制时使用
     */
    var curContentRootView: ViewGroup? = null

    /**
     * 当前输入框绑定的 Window
     * 可能是 Activity，也可能是 Dialog
     */
    var curAttachedWindow: Window? = null
        private set

    /**
     * 当前使用的 Keyboard
     */
    var curKeyboard: Keyboard? = null
        private set

    /**
     * 缓存 Keyboard 数据
     */
    private val keyboardMap = mutableMapOf<String, Keyboard?>()
    /**
     * 当前使用的 KeyboardInfo
     */
    var curKeyboardInfo: KeyboardInfo<*>? = null
        private set


    /**
     * 输入法和输入框之间的间隔；
     * 只有 softInputMode 为 pan 和 auto 时，才生效；
     */
    private var mInputMethodSpaceDp = 0
    private var mModalHeaderSpaceDp = 0


    /**
     * 有效内容区域上浮 diff
     * 用于 dialog，Activity 已经占满屏幕，不会再上浮
     */
    private var mContentDiff = 0

    /**
     * 可滚动组件的滚动 diff
     * 用于 dialog 和 activity
     */
    private var mScrollDiff = 0

    /**
     * Space View
     * 用于ScrollView内部滚动时，底部没有滚动距离，原生主动添加的 View，高度会依赖滚动距离自适应调整；
     */
    private var scrollBottomSpaceForScrollView: SpaceView = SpaceView(context)

    private val keyboardTypeHandlerMap = mutableMapOf<String, IKeyboardTypeHandler>()

    private var popupWindow: PopupWindow? = null

    constructor(context: Context): super(context)

    constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int): super(context, attrs, defStyleAttr)

    init {
        LayoutInflater.from(context).inflate(R.layout.layout_keyboard_container, this, true)
        keyboardView = findViewById(R.id.v_keyboard)

        isClickable = false
        isFocusable = false
        isFocusableInTouchMode = false
    }

    fun bindReactEditText(view: ReactEditText?, keyboardInfo: KeyboardInfo<*>?, scrollView: ReactScrollView?, xrnKeyboardModule: XRNKeyboardModule?) {
        keyboardTypeHandlerMap[curKeyboardInfo?.keyboardType]?.onDetach(this)

        keyboardInfo?.let {
            curKeyboard = getKeyboard(it.keyboardType)
            curKeyboardInfo = it
            curEditView = view


            val pair = XTModalHostView.getAttachedModalHost(view)
            if (pair?.first != null) { //输入框 属于 Dialog
                curModalHostView = pair.first
                curKeyboardModule = null
                mInputMethodSpaceDp = pair.first.mInputMethodSpaceDp
                mModalHeaderSpaceDp = pair.first.mModalHeaderSpaceDp
                curScrollView = scrollView ?: KeyboardTools.findScrollableView(view)
                curContentRootView = pair.first.findKeyboardContentView()
            } else { // 输入框属于 Activity
                curModalHostView = null
                curKeyboardModule = xrnKeyboardModule
                mInputMethodSpaceDp = xrnKeyboardModule?.inputMethodSpace ?: Constants.DEFAULT_SOFT_INPUT_SPACE
                mModalHeaderSpaceDp = 0
                curScrollView = scrollView ?: KeyboardTools.findScrollableView(view)
                curContentRootView = null
            }

            curAttachedWindow = XTModalHostView.getAttachedWindow(view)

            val keyboardTypeHandler = getKeyboardTypeHandler(curKeyboardInfo?.keyboardType ?: "")
            keyboardView.setKeyDrawListener(keyboardTypeHandler)
            keyboardView.onKeyboardActionListener = keyboardTypeHandler
            keyboardTypeHandler?.onAttach(this)
            //最后绑定 keyboard
            keyboardView.keyboard = curKeyboard

        }
    }

    private fun getInputMethodSpacePx(): Int {
        return SizeUtils.dp2px(mInputMethodSpaceDp.toFloat())
    }

    private fun getModalHeaderSpacePx(): Int {
        return BarUtils.getStatusBarHeight() + SizeUtils.dp2px(mModalHeaderSpaceDp.toFloat())
    }

    private fun getSoftInputMode(): String {
        if (curModalHostView != null) {
            return curModalHostView?.mSoftInputMode ?: Constants.SOFT_INPUT_MODE_PAN
        } else if (curKeyboardModule != null) {
            return curKeyboardModule?.pageSoftInputMode ?: Constants.SOFT_INPUT_MODE_RESIZE
        } else {
            return Constants.SOFT_INPUT_MODE_RESIZE
        }
    }

    private fun getKeyboard(keyboardType: String): Keyboard? {
        return keyboardMap[keyboardType] ?: KeyboardTools.createKeyboard(context, keyboardType)?.apply {
            keyboardMap[keyboardType] = this
        }
    }

    private fun getKeyboardTypeHandler(keyboardType: String): IKeyboardTypeHandler? {
        return keyboardTypeHandlerMap[keyboardType] ?: KeyboardTools.createKeyboardTypeHandler(context, keyboardType)?.apply {
            keyboardTypeHandlerMap[keyboardType] = this
        }
    }

    fun isShowing(): Boolean {
        return popupWindow?.isShowing == true
    }


    fun showKeyboard() {
        if (popupWindow?.isShowing == true) {
            return
        }
        if (popupWindow == null) {
            popupWindow = PopupWindow(this,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                false // 是否可获得焦点
            )
            popupWindow?.animationStyle = R.style.KeyboardAnimation

        }
        popupWindow?.contentView = this
        popupWindow?.showAtLocation(
            curAttachedWindow?.decorView,
            Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL,
            0,
            0
        )
        post {
            if (curModalHostView != null) {
                onDialogShowKeyboard()
            } else {
                onActivityShowKeyboard()
            }
        }

    }

    /**
     * Activity 显示 keyboard 的后续处理
     */
    private fun onActivityShowKeyboard() {
        if (getSoftInputMode() == Constants.SOFT_INPUT_MODE_RESIZE) {
            onResizeShowKeyboard()
            return
        }
        val localCurScrollView = curScrollView
        //pan 和 auto 模式
        curEditView?.let {
            //获取输入框在屏幕上的位置
            val focusViewArray = IntArray(2)
            it.getLocationOnScreen(focusViewArray)
            //输入框需要的偏移量
            val focusDiff = focusViewArray[1] + it.height + getInputMethodSpacePx() + measuredHeight + getBottomNavigatorBarHeight(curAttachedWindow) - ScreenUtils.getScreenHeight()

            if (focusDiff > 0) { // 输入框会被遮挡，需要偏移
                if (localCurScrollView != null && getSoftInputMode() == Constants.SOFT_INPUT_MODE_AUTO) { //有可滚动组件时，滚动组件内部消化
                    val scrollableViewArray = IntArray(2)
                    it.getLocationOnScreen(scrollableViewArray)
                    mScrollDiff = focusDiff
                    installSpaceView(curScrollView, focusDiff)
                    localCurScrollView.postDelayed({
                        localCurScrollView.smoothScrollBy(
                            0,
                            focusDiff
                        )
                    }, 0)

                } else { //无可滚动组件，整体上浮
                    mContentDiff = -focusDiff
                    getContentViewByWindow(curAttachedWindow)?.offsetTopAndBottom(-focusDiff)
                    uninstallSpaceView(curScrollView)
                }
            } else { //键盘不会遮挡，无需处理
                uninstallSpaceView(curScrollView)
            }
            return
        }
    }

    /**
     * Dialog 显示 Keyboard 的后续处理
     */
    private fun onDialogShowKeyboard() {
        if (getSoftInputMode() == Constants.SOFT_INPUT_MODE_RESIZE) {
            onResizeShowKeyboard()
            return
        }
        //pan 和 auto 模式
        val localScrollView = curScrollView
        val localVisibleRootView = curContentRootView
        val localEditText = curEditView
        localEditText?.let {
            val screenHeight = ScreenUtils.getScreenHeight()
            val navigatorHeight = getBottomNavigatorBarHeight(curAttachedWindow)
            //获取输入框在屏幕上的位置
            val focusViewArray = IntArray(2)
            it.getLocationOnScreen(focusViewArray)
            //输入框需要的偏移量
            val focusDiff = focusViewArray[1] + it.height + getInputMethodSpacePx() + measuredHeight  + navigatorHeight - ScreenUtils.getScreenHeight()
            if (focusDiff > 0) { // 输入框会被遮挡，需要偏移
                if (localScrollView != null && localVisibleRootView != null && getSoftInputMode() == Constants.SOFT_INPUT_MODE_AUTO) { //有滚动 & 可见视图根组件时
                    //获取弹窗内容区域在屏幕上的位置
                    val visibleViewArray = IntArray(2)
                    localVisibleRootView.getLocationOnScreen(visibleViewArray)
                    //整体上移最大值
                    val visibleRootViewMaxDiff = visibleViewArray[1] - getModalHeaderSpacePx()

                    if (focusDiff <= visibleRootViewMaxDiff) { //输入框偏移量小于最大偏移量，只需整体上移
                        mContentDiff = -focusDiff
                        getContentViewByWindow(curModalHostView?.dialog?.window)?.offsetTopAndBottom(-focusDiff)
                        uninstallSpaceView(localScrollView)
                    } else { //输入框偏移量大于最大偏移量，整体上移最大偏移量，剩下的需要内部滚动补充

                        val scrollableViewArray = IntArray(2)
                        localScrollView.getLocationOnScreen(scrollableViewArray)

                        mContentDiff = -visibleRootViewMaxDiff
                        getContentViewByWindow(curModalHostView?.dialog?.window)?.offsetTopAndBottom(-visibleRootViewMaxDiff)
                        val scrollDiff =
                            focusDiff - visibleRootViewMaxDiff /*+ (scrollableViewArray[1] - visibleViewArray[1])*/
                        installSpaceView(localScrollView, scrollDiff)
                        mScrollDiff = scrollDiff
                        localScrollView.smoothScrollBy(
                            0,
                            scrollDiff
                        )
                    }

                } else { // 整体上浮
                    if (focusViewArray[1] < (screenHeight - navigatorHeight) && (focusViewArray[1] + it.height + getInputMethodSpacePx()) > (screenHeight - navigatorHeight)) { // 输入框露出一半时
                        //超过区域的高度
                        val overFocusHeight = focusViewArray[1] + it.height + getInputMethodSpacePx()  - (screenHeight - navigatorHeight)
                        mContentDiff = -(focusDiff - overFocusHeight)
                    } else {
                        mContentDiff = -focusDiff
                    }
                    getContentViewByWindow(curAttachedWindow)?.offsetTopAndBottom(mContentDiff)
                    uninstallSpaceView(localScrollView)

                }
            } else { //键盘不会遮挡，无需处理
                uninstallSpaceView(curScrollView)
            }
        }
    }

    private fun onResizeShowKeyboard() {
        val decorView = curAttachedWindow?.decorView
        decorView?.let {
            it.setPadding(it.paddingLeft, it.paddingTop, it.paddingRight, measuredHeight)
        }
    }

    private fun installSpaceView(scrollableView: ViewGroup?, height: Int) {

        if (scrollBottomSpaceForScrollView.parent is ViewGroup) {
            (scrollBottomSpaceForScrollView.parent as ViewGroup).removeView(scrollBottomSpaceForScrollView)
        }

        scrollBottomSpaceForScrollView.space = height

        val scrollRootView = scrollableView?.getChildAt(0)
        (scrollRootView as? ViewGroup)?.let {
            it.addView(scrollBottomSpaceForScrollView)
            scrollBottomSpaceForScrollView.measure(
                MeasureSpec.makeMeasureSpec(it.width, MeasureSpec.AT_MOST),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
            )
            scrollBottomSpaceForScrollView.layout(0, it.height, scrollBottomSpaceForScrollView.measuredWidth, it.height + scrollBottomSpaceForScrollView.measuredHeight)
            it.layout(it.left, it.top, it.right, it.bottom + scrollBottomSpaceForScrollView.measuredHeight)
        }
    }

    private fun uninstallSpaceView(scrollableView: ViewGroup?) {
        if (scrollBottomSpaceForScrollView.parent is ViewGroup) {
            (scrollBottomSpaceForScrollView.parent as ViewGroup).removeView(scrollBottomSpaceForScrollView)
        }
        val scrollableRootView = scrollableView?.getChildAt(0)
        scrollableRootView?.let {
            it.layout(it.left, it. top, it.right, it.bottom - mScrollDiff)
        }
    }

    fun hideKeyboard() {
        if (popupWindow == null || popupWindow?.isShowing == false) {
            return
        }
        popupWindow?.dismiss()
        onKeyboardHide()
    }

    private fun onKeyboardHide() {

        val decorView = curAttachedWindow?.decorView
        decorView?.let {
            it.setPadding(it.paddingLeft, it.paddingTop, it.paddingRight, 0)
        }

        //偏移量恢复 & 重置偏移量
        getContentViewByWindow(curAttachedWindow)?.offsetTopAndBottom(-mContentDiff)
        mContentDiff = 0

        //滚动恢复 & 重置滚动
        curScrollView?.scrollBy(0, -mScrollDiff)
        uninstallSpaceView(curScrollView)
        mScrollDiff = 0

        curEditView?.requestLayout()

    }

    private fun getContentViewByWindow(window: Window?): View? {
        return window?.decorView?.rootView?.findViewById<View>(android.R.id.content)
    }
}