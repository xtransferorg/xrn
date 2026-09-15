package xrn.modules.keyboard

import android.app.Activity
import android.app.Dialog
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver.OnGlobalFocusChangeListener
import android.view.ViewTreeObserver.OnGlobalLayoutListener
import android.view.Window
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.blankj.utilcode.util.BarUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ScreenUtils
import com.blankj.utilcode.util.SizeUtils
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.facebook.react.views.modal.ReactModalHostView
import xrn.modules.keyboard.Constants.NATIVE_ID_KEYBOARD_CONTENT
import xrn.modules.keyboard.inputmethod.KeyboardContainer
import xrn.modules.keyboard.inputmethod.KeyboardTools
import xrn.modules.keyboard.inputmethod.KeyboardTools.getBottomNavigatorBarHeight

class XTModalHostView(val context: ThemedReactContext): ReactModalHostView(context) {

    private var uiHandler = Looper.myLooper()?.let { Handler(it) }

    /**
     * 软键盘模式
     * resize：整个窗口高度重新计算；
     * pan：整个窗口上移，大小不变；
     * auto: 整个窗口上移，顶部会有最小留白，如果窗口上移到顶部，剩下上移 distance 需要内部滚动组件消化；
     * 默认是 resize
     */
    var mSoftInputMode = Constants.SOFT_INPUT_MODE_RESIZE
        private set

    /**
     * 输入法和输入框之间的间隔；单位是 dp
     * 只有 softInputMode 为 pan 和 auto 时，才生效；
     */
    var mInputMethodSpaceDp = Constants.DEFAULT_SOFT_INPUT_SPACE
        private set

    /**
     * 弹窗可见内容区域中可滚动 View 对应的 tag
     */
    private var mScrollableViewTag: String? = null
        private set

    /**
     * 弹窗顶部留白间隔，单位是 dp
     * 除了状态栏高度外的留白距离；
     */
    var mModalHeaderSpaceDp = 0
        private set

    /**
     * Space View
     * 用于ScrollView内部滚动时，底部没有滚动距离，原生主动添加的 View，高度会依赖滚动距离自适应调整；
     */
    private var scrollBottomSpaceForScrollView: SpaceView = SpaceView(context)

    /**
     * 可见区域 RootView 上移偏移量
     * 用于键盘收起时，重置位置
     */
    private var contentViewOffset = 0

    /**
     * ScrollView 滚动距离
     * 用于键盘收起时，重置位置
     */
    private var scrollOffset = 0

    private var mPanModeGlobalLayoutListener: OnGlobalLayoutListener? = null
    private var mAutoModeGlobalLayoutListener: OnGlobalLayoutListener? =  null
    private var isKeyboardShowHandled = false

    var mOnGlobalFocusChangeListener: OnGlobalFocusChangeListener? = null

    //当前可滚动组件，只有在 auto 模式下，键盘弹起，并且需要滚动组件
    private var mCurScrollableView: ViewGroup? = null

    override fun showOrUpdate() {
        super.showOrUpdate()
        if (statusBarTranslucent) {
            val contentView = dialog?.window?.decorView?.rootView?.findViewById<ViewGroup>(android.R.id.content)
            contentView?.getChildAt(0)?.fitsSystemWindows = true
        }
        if (dialog?.window?.decorView?.isAttachedToWindow == true) {
            dialog?.window?.setSoftInputMode(convertSysSoftInputMode(mSoftInputMode))
        } else {
            dialog?.window?.decorView?.post {
                if (dialog?.window?.decorView?.isAttachedToWindow == true) {
                    dialog?.window?.setSoftInputMode(convertSysSoftInputMode(mSoftInputMode))
                }
            }
        }
        dialog?.let {
            it.setOnDismissListener {
                if (DIALOG_MAP[this] == it) {
                    DIALOG_MAP.remove(this)
                }
            }
            DIALOG_MAP[this] = it
        }

        //重置偏移量数据
        contentViewOffset = 0
        scrollOffset = 0

        // handleSafeArea()
        handlePanMode()
        handleAutoMode()
        clearActivityFocus()
    }

    private fun getInputMethodSpacePx(): Int {
        return SizeUtils.dp2px(mInputMethodSpaceDp.toFloat())
    }

    private fun getModalHeaderSpacePx(): Int {
        return BarUtils.getStatusBarHeight() + SizeUtils.dp2px(mModalHeaderSpaceDp.toFloat())
    }

    /**
     * 清除Activity的焦点
     */
    private fun clearActivityFocus() {
        if (context.baseContext is Activity) {
            (context.baseContext as Activity).window?.decorView?.findFocus()?.clearFocus()
        }
    }

    private fun handleSafeArea() {
        if ( dialog == null || dialog?.isShowing != true) return

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return

        dialog?.window?.decorView?.findViewById<View>(android.R.id.content)?.let { rootView ->
            ViewCompat.getRootWindowInsets(rootView)
                ?.getInsets(WindowInsetsCompat.Type.navigationBars())?.let { navigationBars ->
                    rootView.updatePadding(bottom = navigationBars.bottom)
                }
        }
    }

    /**
     * pan 模式
     */
    private fun handlePanMode() {
        if (mSoftInputMode != Constants.SOFT_INPUT_MODE_PAN) {
            dialog?.window?.decorView?.viewTreeObserver?.removeOnGlobalLayoutListener(mPanModeGlobalLayoutListener)
            return
        }
        dialog?.window?.decorView?.let {
            it.viewTreeObserver.removeOnGlobalLayoutListener(mPanModeGlobalLayoutListener)
            if (mSoftInputMode != Constants.SOFT_INPUT_MODE_PAN) {
                return
            }
            if (mPanModeGlobalLayoutListener == null) {
                mPanModeGlobalLayoutListener = OnGlobalLayoutListener {
                    val screenHeight = ScreenUtils.getScreenHeight()
                    val rect = Rect()
                    it.getWindowVisibleDisplayFrame(rect)
                    val keyboardHeight = it.height - rect.bottom

                    val focusedView = it.findFocus()
                    val navigatorHeight = getBottomNavigatorBarHeight(dialog?.window)
                    if (keyboardHeight > navigatorHeight && focusedView != null) {
                        val location = IntArray(2)
                        focusedView.getLocationOnScreen(location)
                        val inputBottom = location[1] + focusedView.height

                        val gap = inputBottom - rect.bottom
                        val extraOffset = getInputMethodSpacePx()

                        if (location[1] < (screenHeight - navigatorHeight) && (location[1] + focusedView.height + extraOffset) > (screenHeight - navigatorHeight)) { //输入框露出一半时
                            //do nothing
                        } else if (gap + extraOffset > 0) {
                            it.scrollBy(0, gap + extraOffset)
                        }
                    } else {
                        // 键盘收回，重置
                        it.scrollTo(0, 0)
                    }
                }
            }
            it.viewTreeObserver.addOnGlobalLayoutListener(mPanModeGlobalLayoutListener)
        }
    }

    private fun handleAutoMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            handleAutoModeAfter30()
        } else {
            handleAutoModeBelow30()
        }
    }

    private fun handleAutoModeBelow30() {
        if (mSoftInputMode != Constants.SOFT_INPUT_MODE_AUTO) {
            (context.baseContext as? Activity)?.window?.decorView?.viewTreeObserver?.removeOnGlobalLayoutListener(mAutoModeGlobalLayoutListener)
            return
        }
        //获取弹窗的 content view
        val contentView = dialog?.window?.decorView?.rootView?.findViewById<View>(android.R.id.content)
        dialog?.window?.decorView?.let {
            (context.baseContext as? Activity)?.window?.decorView?.viewTreeObserver?.removeOnGlobalLayoutListener(mAutoModeGlobalLayoutListener)
            if (mSoftInputMode != Constants.SOFT_INPUT_MODE_AUTO) {
                return
            }
            if (mAutoModeGlobalLayoutListener == null) {
                mAutoModeGlobalLayoutListener = OnGlobalLayoutListener {

                    val screenHeight = ScreenUtils.getScreenHeight()
                    val rect = Rect()
                    //Dialog 获取可见区域，获取不到，Activity的可见区域可以获取到
                    (context.baseContext as? Activity)?.window?.decorView?.getWindowVisibleDisplayFrame(rect)
                    val keyboardHeight = it.height - rect.bottom

                    val focusView = it.findFocus()
                    val visibleRootView = findKeyboardContentView()


                    LogUtils.d(TAG, "handleAutoModeBelow30:KeyboardHeight=${keyboardHeight}, visibleRootView=${visibleRootView?.javaClass?.simpleName}, focusView=${focusView?.javaClass?.simpleName}")

                    if (keyboardHeight  > screenHeight * 0.15 && focusView != null) { //键盘弹起时
                        if (isKeyboardShowHandled) {
                            return@OnGlobalLayoutListener
                        }
                        isKeyboardShowHandled = true
                        val scrollableView = KeyboardTools.findScrollableView(focusView)

                        val navigatorHeight = getBottomNavigatorBarHeight(dialog?.window)
                        //获取输入框在屏幕上的位置
                        val focusViewArray = IntArray(2)
                        focusView.getLocationOnScreen(focusViewArray)
                        //输入框需要的偏移量
                        val focusDiff =
                            focusViewArray[1] + focusView.height + getInputMethodSpacePx() + keyboardHeight - screenHeight

                        if (focusDiff > 0) { // 输入框会被遮挡，需要偏移
                            if (visibleRootView != null && scrollableView != null) { //业务侧指定了可滚动组件 & 可见根组件
                                //获取弹窗内容区域在屏幕上的位置
                                val visibleViewArray = IntArray(2)
                                visibleRootView.getLocationOnScreen(visibleViewArray)

                                //整体上移最大值
                                val visibleRootViewMaxDiff = visibleViewArray[1] - getModalHeaderSpacePx()

                                if (focusDiff <= visibleRootViewMaxDiff) { //输入框偏移量小于最大偏移量，只需整体上移
                                    contentViewOffset = -focusDiff
                                    contentView?.offsetTopAndBottom(-focusDiff)
                                    uninstallSpaceView()
                                } else { //输入框偏移量大于最大偏移量，整体上移最大偏移量，剩下的需要内部滚动补充

                                    val scrollableViewArray = IntArray(2)
                                    scrollableView.getLocationOnScreen(scrollableViewArray)

                                    contentViewOffset = -visibleRootViewMaxDiff
                                    contentView?.offsetTopAndBottom(-visibleRootViewMaxDiff)
                                    val scrollDiff =
                                        focusDiff - visibleRootViewMaxDiff /*+ (scrollableViewArray[1] - visibleViewArray[1])*/
                                    installSpaceView(scrollableView, scrollDiff)
                                    scrollOffset = scrollDiff
                                    scrollableView.smoothScrollBy(
                                        0,
                                        scrollDiff
                                    )
                                }
                            } else { //没设置可滚动组件 & 可见区域根组件，则整体上移
                                if (focusViewArray[1] < (screenHeight - navigatorHeight) && (focusViewArray[1] + focusView.height + getInputMethodSpacePx()) > (screenHeight - navigatorHeight)) { // 输入框露出一半时
                                    //超过区域的高度
                                    val overFocusHeight = focusViewArray[1] + focusView.height + getInputMethodSpacePx()  - (screenHeight - navigatorHeight)
                                    contentViewOffset = -(focusDiff - overFocusHeight)
                                } else {
                                    contentViewOffset = -focusDiff
                                }
                                contentView?.offsetTopAndBottom(contentViewOffset)
                                uninstallSpaceView()
                            }
                        } else { //键盘不会遮挡，无需处理
                            uninstallSpaceView()
                        }
                    } else { //键盘收起时
                        isKeyboardShowHandled = false
                        //偏移量恢复 & 重置偏移量
                        contentView?.offsetTopAndBottom(-contentViewOffset)
                        contentViewOffset = 0

                        //滚动恢复 & 重置滚动
                        mCurScrollableView?.scrollBy(0, -scrollOffset)
                        uninstallSpaceView()
                        scrollOffset = 0
                    }

                }
            }
            (context.baseContext as? Activity)?.window?.decorView?.viewTreeObserver?.addOnGlobalLayoutListener(mAutoModeGlobalLayoutListener)
        }
    }

    private fun handleAutoModeAfter30() {

        if (mSoftInputMode != Constants.SOFT_INPUT_MODE_AUTO) {
            if (statusBarTranslucent) {
                dialog?.window?.decorView?.setOnApplyWindowInsetsListener { v, insets ->
                    val defaultInsets = v.onApplyWindowInsets(insets)
                    defaultInsets.replaceSystemWindowInsets(
                        defaultInsets.systemWindowInsetLeft,
                        0,
                        defaultInsets.systemWindowInsetRight,
                        defaultInsets.systemWindowInsetBottom
                    )
                }
            } else {
                dialog?.window?.decorView?.setOnApplyWindowInsetsListener(null)
            }
            return
        }

        //获取弹窗的 content view
        val contentView = dialog?.window?.decorView?.findViewById<View>(android.R.id.content)

        dialog?.window?.decorView?.let {
            ViewCompat.setOnApplyWindowInsetsListener(it, object :
                androidx.core.view.OnApplyWindowInsetsListener {
                override fun onApplyWindowInsets(
                    v: View,
                    insets: WindowInsetsCompat
                ): WindowInsetsCompat {

                    if (mSoftInputMode != Constants.SOFT_INPUT_MODE_AUTO) {
                        return insets
                    }

                    // IME 键盘高度
                    val ime = insets?.getInsets(WindowInsetsCompat.Type.ime())

                    val focusView = contentView?.findFocus()
                    val visibleRootView = findKeyboardContentView()



                    LogUtils.d(TAG, "handleAutoModeAfter30:KeyboardHeight=${ime?.bottom}, visibleRootView=${visibleRootView?.javaClass?.simpleName}, focusView=${focusView?.javaClass?.simpleName}, isVisible=${insets?.isVisible(WindowInsetsCompat.Type.ime())}")

                    val screenHeight = ScreenUtils.getScreenHeight()
                    var postHandle = false
                    val imeHeight = if ((ime?.bottom ?: 0) > 0) {
                        ime?.bottom ?: 0
                    } else if (insets?.isVisible(WindowInsetsCompat.Type.ime()) == true) { //vivo 手机上，键盘弹起时，bottom = 0,
                        postDelayed({
                            val rect = Rect()
                            //Dialog 获取可见区域，获取不到，Activity的可见区域可以获取到
                            (context.baseContext as? Activity)?.window?.decorView?.getWindowVisibleDisplayFrame(rect)
                            val keyboardHeight = it.height - rect.bottom
                            val imeHeightPost = if (keyboardHeight  > screenHeight * 0.15) keyboardHeight else 0
                            LogUtils.d(TAG, "handleAutoModeAfter30:postHandle, keyboardHeight=${keyboardHeight}")
                            handleAutoModeAfter30Inner(imeHeightPost, focusView, visibleRootView, contentView)
                        }, 150)
                        postHandle = true
                        0
                    } else {
                        0
                    }
                    if (!postHandle) {
                        handleAutoModeAfter30Inner(
                            imeHeight,
                            focusView,
                            visibleRootView,
                            contentView
                        )
                    }

                    if (statusBarTranslucent) {
                        insets.toWindowInsets()?.let {
                            val underlying = v.onApplyWindowInsets(it)
                            val modified = underlying.replaceSystemWindowInsets(
                                underlying.systemWindowInsetLeft,
                                0,
                                underlying.systemWindowInsetRight,
                                underlying.systemWindowInsetBottom
                            )
                            return WindowInsetsCompat.toWindowInsetsCompat(modified, v)
                        }
                    }

                    return insets
                }

            })
        }
    }

    private fun handleAutoModeAfter30Inner(imeHeight: Int, focusView: View?, visibleRootView: ViewGroup?, dialogContentView: View?) {
        val screenHeight = ScreenUtils.getScreenHeight()
        LogUtils.d(TAG, "handleAutoModeAfter30Inner:imeHeight=${imeHeight}")
        if (imeHeight > 0 && focusView != null) { //键盘弹起时
            val scrollableView = KeyboardTools.findScrollableView(focusView)

            val navigatorHeight = getBottomNavigatorBarHeight(dialog?.window)
            //获取输入框在屏幕上的位置
            val focusViewArray = IntArray(2)
            focusView.getLocationOnScreen(focusViewArray)
            //输入框需要的偏移量
            val focusDiff =
                focusViewArray[1] + focusView.height + getInputMethodSpacePx() + imeHeight - screenHeight

            if (focusDiff > 0) { // 输入框会被遮挡，需要偏移
                if (visibleRootView != null && scrollableView != null) { //业务侧指定了可滚动组件 & 可见根组件
                    //获取弹窗内容区域在屏幕上的位置
                    val visibleViewArray = IntArray(2)
                    visibleRootView.getLocationOnScreen(visibleViewArray)

                    //整体上移最大值
                    val visibleRootViewMaxDiff = visibleViewArray[1] - getModalHeaderSpacePx()

                    if (focusDiff <= visibleRootViewMaxDiff) { //输入框偏移量小于最大偏移量，只需整体上移
                        contentViewOffset = -focusDiff
                        dialogContentView?.offsetTopAndBottom(-focusDiff)
                        uninstallSpaceView()
                    } else { //输入框偏移量大于最大偏移量，整体上移最大偏移量，剩下的需要内部滚动补充

                        val scrollableViewArray = IntArray(2)
                        scrollableView.getLocationOnScreen(scrollableViewArray)

                        contentViewOffset = -visibleRootViewMaxDiff
                        dialogContentView?.offsetTopAndBottom(-visibleRootViewMaxDiff)
                        val scrollDiff =
                            focusDiff - visibleRootViewMaxDiff /*+ (scrollableViewArray[1] - visibleViewArray[1])*/
                        installSpaceView(scrollableView, scrollDiff)
                        scrollOffset = scrollDiff
                        scrollableView.smoothScrollBy(
                            0,
                            scrollDiff
                        )
                    }
                } else { //没设置可滚动组件 & 可见区域根组件，则整体上移
                    if (focusViewArray[1] < (screenHeight - navigatorHeight) && (focusViewArray[1] + focusView.height + getInputMethodSpacePx()) > (screenHeight - navigatorHeight)) { // 输入框露出一半时
                        //超过区域的高度
                        val overFocusHeight = focusViewArray[1] + focusView.height + getInputMethodSpacePx()  - (screenHeight - navigatorHeight)
                        contentViewOffset = -(focusDiff - overFocusHeight)
                    } else {
                        contentViewOffset = -focusDiff
                    }
                    dialogContentView?.offsetTopAndBottom(contentViewOffset)
                    uninstallSpaceView()
                }
            } else { //键盘不会遮挡，无需处理
                uninstallSpaceView()
            }
        } else { //键盘收起时
            //偏移量恢复 & 重置偏移量
            dialogContentView?.offsetTopAndBottom(-contentViewOffset)
            contentViewOffset = 0

            //滚动恢复 & 重置滚动
            mCurScrollableView?.scrollBy(0, -scrollOffset)
            uninstallSpaceView()
            scrollOffset = 0
        }
    }

    private fun installSpaceView(scrollableView: ViewGroup?, height: Int) {

        if (scrollBottomSpaceForScrollView.parent is ViewGroup) {
            (scrollBottomSpaceForScrollView.parent as ViewGroup).removeView(scrollBottomSpaceForScrollView)
        }
        mCurScrollableView = scrollableView

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

    private fun uninstallSpaceView() {
        if (scrollBottomSpaceForScrollView.parent is ViewGroup) {
            (scrollBottomSpaceForScrollView.parent as ViewGroup).removeView(scrollBottomSpaceForScrollView)
        }
        val scrollableRootView = mCurScrollableView?.getChildAt(0)
        scrollableRootView?.let {
            it.layout(it.left, it. top, it.right, it.bottom - scrollBottomSpaceForScrollView.space)
            scrollBottomSpaceForScrollView.space = 0
        }
        mCurScrollableView = null
    }


    override fun setOnRequestCloseListener(listener: OnRequestCloseListener?) {
        super.setOnRequestCloseListener(listener)
    }

    private fun convertSysSoftInputMode(softInputMode: String?): Int {
        return when(softInputMode) {
            "resize" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            "pan" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
            "auto" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
            else -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
    }

    fun setSoftInputMode(mode: String?) {
        mSoftInputMode = mode ?: "resize"
    }

    fun setSpace(space: Int) {
        mInputMethodSpaceDp = if (space <= 0) 0 else space
    }

    fun setScrollableViewTag(tag: String?) {
        mScrollableViewTag = tag
    }

    fun setModalHeaderSpace(modalHeaderSpace: Int) {
        mModalHeaderSpaceDp = modalHeaderSpace
    }


    /**
     * 查找弹窗的内容根组件
     */
    fun findKeyboardContentView(): ViewGroup? {
        if (dialog?.window?.decorView?.rootView == null) {
            return null
        }
        val keyboardContentView = ReactFindViewUtil.findView(dialog?.window?.decorView?.rootView!!, NATIVE_ID_KEYBOARD_CONTENT)
        return keyboardContentView as? ViewGroup
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        DIALOG_MAP.remove(this)
        KEYBOARD_CONTAINER_MAP.remove(this)
        dialog?.window?.decorView?.viewTreeObserver?.removeOnGlobalLayoutListener(mPanModeGlobalLayoutListener)
        dialog?.window?.decorView?.setOnApplyWindowInsetsListener(null)
        (context.baseContext as? Activity)?.window?.decorView?.viewTreeObserver?.removeOnGlobalLayoutListener(mAutoModeGlobalLayoutListener)
    }

    companion object {
        val TAG = XTModalHostView::class.java.simpleName

        /**
         * 记录 ModalHostView 关联的 Dialog
         */
        val DIALOG_MAP = mutableMapOf<XTModalHostView, Dialog>()

        /**
         * 存储 XTModalHostView 关联的 KeyboardContainer
         */
        val KEYBOARD_CONTAINER_MAP = mutableMapOf<XTModalHostView, KeyboardContainer>()

        /**
         * 获取或创建 KeyboardContainer
         */
        fun getOrCreateKeyboardContainer(modalHost: XTModalHostView?): KeyboardContainer? {
            if (modalHost == null) {
                return null
            }
            val keyboardContainer = KEYBOARD_CONTAINER_MAP[modalHost] ?: KeyboardContainer(modalHost.context)
            KEYBOARD_CONTAINER_MAP[modalHost] = keyboardContainer
            return keyboardContainer
        }

        /**
         * 获取 View 所属的 ModalHost
         */
        fun getAttachedModalHost(view: View?): Pair<XTModalHostView, Dialog>? {
            view?.let {
                val rootView = it.rootView
                for ((modalHost, dialog) in DIALOG_MAP) {
                    if (dialog.window?.decorView == rootView) {
                        return Pair(modalHost, dialog)
                    }
                }
            }
            return null
        }

        /**
         * 获取 View 所属的 Window
         */
        fun getAttachedWindow(view: View?): Window? {
            if (view == null) {
                return null
            }
            val pair = getAttachedModalHost(view)
            val window: Window? = if (pair?.second != null) {
                pair.second.window
            } else {
                ((view.context as? ThemedReactContext)?.baseContext as? Activity)?.window
            }
            return window
        }

    }
}