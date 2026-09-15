package xrn.modules.keyboard

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.SparseArray
import android.view.MotionEvent
import android.view.View
import android.view.ViewTreeObserver.OnGlobalFocusChangeListener
import android.view.WindowManager
import com.blankj.utilcode.util.LogUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.textinput.ReactEditText
import com.xrn.keyboard.NativeXRNKeyboardModuleSpec
import xrn.modules.keyboard.Constants.DEFAULT_SOFT_INPUT_SPACE
import xrn.modules.keyboard.Constants.NATIVE_ID_KEYBOARD_CONTENT
import xrn.modules.keyboard.XTModalHostView.Companion.TAG
import xrn.modules.keyboard.inputmethod.KEYBOARD_TYPE_SYSTEM
import xrn.modules.keyboard.inputmethod.KeyboardContainer
import xrn.modules.keyboard.inputmethod.KeyboardInfo
import xrn.modules.keyboard.inputmethod.convertKeyboardInfo
import xrn.modules.keyboard.inputmethod.hideSystemInputMethod
import java.util.WeakHashMap

class XRNKeyboardModule(reactContext: ReactApplicationContext) :
    NativeXRNKeyboardModuleSpec(reactContext) {

    /**
     * 当前 Activity 的 输入法模式
     * 只有两种模式：resize 和 pan
     * auto 模式由于1.逻辑复杂，2.涉及可滚动组件需及时更新，所以暂不支持；
     */
    var pageSoftInputMode: String = Constants.SOFT_INPUT_MODE_RESIZE
        private set

    /**
     * 输入法和输入框之间的间隔
     */
    var inputMethodSpace: Int = DEFAULT_SOFT_INPUT_SPACE
        private set

    /**
     * 存储当前 Activity 的 KeyboardContainer，可以复用
     * 可能存在一个 Bundle 多个 Activity，所以需要多个；
     */
    private val activityKeyboardContainerMap: WeakHashMap<Activity, KeyboardContainer> = WeakHashMap()

    /**
     * 页面级别的 Focus Change 回调
     * 可能存在一个 Bundle 多个 Activity，所以需要多个；
     */
    private val activityOnGlobalFocusChangeListenerMap: WeakHashMap<Activity, OnGlobalFocusChangeListener> = WeakHashMap()

    /**
     * 存储当前 Activity 的 KeyboardInfo
     * reactTag -> KeyboardInfo
     */
    private val keyboardInfos = SparseArray<KeyboardInfo<*>>()

    private val uiHandler = Handler(Looper.getMainLooper())

    @ReactMethod
    override fun getKeyboardContentNativeID(promise: Promise) {
        promise.resolve(NATIVE_ID_KEYBOARD_CONTENT)
    }

    @ReactMethod
    override fun setSoftInputMode(mode: String?, promise: Promise?) {
        pageSoftInputMode = mode ?: Constants.SOFT_INPUT_MODE_RESIZE
        // 页面级别的 softInputMode 暂不支持；
//        val sysSoftInputMode = if (mode == Constants.SOFT_INPUT_MODE_PAN) WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN else WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
//        UiThreadUtil.runOnUiThread {
//            currentActivity?.window?.setSoftInputMode(sysSoftInputMode)
//            promise?.resolve(true)
//        }
    }

    @ReactMethod
    override fun setKeyboard(
        tag: Double,
        keyboardType: String,
        scrollTag: Double,
        keyboardInfo: ReadableMap?,
        promise: Promise
    ) {
        val uiManager = UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC)
        uiHandler.postDelayed({
            val view = try {
                uiManager?.resolveView(tag.toInt())
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
            // reactTag 只有是 ReactEditText 才生效
            if (view is ReactEditText) {
                if (keyboardType == KEYBOARD_TYPE_SYSTEM) {
                    view.showSoftInputOnFocus = true //系统键盘
                    keyboardInfos.remove(view.id)
                } else {
                    view.showSoftInputOnFocus = false
                    val keyboardInfo = convertKeyboardInfo(keyboardType, tag.toInt(), scrollTag.toInt(), keyboardInfo)
                    bindEditTextKeyboard(view, keyboardInfo)
                }
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        }, 0)
    }


    private fun bindEditTextKeyboard(view: ReactEditText?, keyboardInfo: KeyboardInfo<*>?) {
        keyboardInfo?.let {
            keyboardInfos[it.reactTag] = it
        }
        view?.let {
            //禁止弹出系统输入法
            it.showSoftInputOnFocus = false
            it.setOnTouchListener { v, event ->
                if (event.action == MotionEvent.ACTION_UP) {
                    viewFocus(it)
                }
                false
            }
            val pair = XTModalHostView.getAttachedModalHost(view)
            if (pair?.first != null) {
                if (pair.first.mOnGlobalFocusChangeListener == null) {
                    pair.first.mOnGlobalFocusChangeListener = createOnGlobalFocusChangeListener(view)
                    it.rootView.viewTreeObserver.addOnGlobalFocusChangeListener(pair.first.mOnGlobalFocusChangeListener)
                }
            } else {
                val activity = (view.context as? ThemedReactContext)?.baseContext as? Activity
                if (activity != null && activityOnGlobalFocusChangeListenerMap[activity] == null) {
                    val activityOnGlobalFocusChangeListener = createOnGlobalFocusChangeListener(view)
                    activityOnGlobalFocusChangeListenerMap[activity] = activityOnGlobalFocusChangeListener
                    it.rootView.viewTreeObserver.addOnGlobalFocusChangeListener(activityOnGlobalFocusChangeListener)
                }
            }
        }

    }

    /**
     * 获取 KeyboardContainer
     */
    private fun getKeyboardContainer(v: ReactEditText?): KeyboardContainer? {
        if (v == null) {
            return null
        }
        val pair = XTModalHostView.getAttachedModalHost(v)
        return if (pair?.first != null) { // 是 Dialog 中的 输入框
            val dialogKeyboardContainer = XTModalHostView.getOrCreateKeyboardContainer(pair.first)
            dialogKeyboardContainer
        } else { // 是 Activity 中的输入框
            val activity = (v.context as? ThemedReactContext)?.baseContext as? Activity
            if (activity != null && activityKeyboardContainerMap[activity] == null) {
                val activityKeyboardContainer = KeyboardContainer(activity)
                activityKeyboardContainerMap[activity] = activityKeyboardContainer
            }
            activityKeyboardContainerMap[activity]
        }
    }

    /**
     * 执行当获View获取焦点时的一些逻辑，如：显示键盘
     */
    private fun viewFocus(v: ReactEditText) {
        if (keyboardInfos.indexOfKey(v.id) < 0) { //不是自定义键盘
            return
        }
        v.hideSystemInputMethod()
        if (v.hasFocus()) {
            val keyboardInfo = keyboardInfos.get(v.id)
            val uiManager = UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC)
            val scrollView: ReactScrollView? = try {
                uiManager?.resolveView(keyboardInfo.scrollTag) as? ReactScrollView
            } catch (e: Exception) {
                null
            }

            val keyboardContainer = getKeyboardContainer(v)
            keyboardContainer?.bindReactEditText(v, keyboardInfo, scrollView,this)
            keyboardContainer?.showKeyboard()
        }
    }

    private fun viewBlur(view: ReactEditText?) {
        val keyboardContainer = getKeyboardContainer(view)
        keyboardContainer?.hideKeyboard()
    }

    private fun createOnGlobalFocusChangeListener(view: ReactEditText?): OnGlobalFocusChangeListener {
        return object : OnGlobalFocusChangeListener {
            override fun onGlobalFocusChanged(oldFocus: View?, newFocus: View?) {
                LogUtils.d(TAG, "OnGlobalFocusChangeListener:oldFocus=${oldFocus?.javaClass?.simpleName}, newFocus=${newFocus?.javaClass?.simpleName}, this=${this}")
                if (newFocus is ReactEditText && keyboardInfos.indexOfKey(newFocus.id) >= 0) {
                    viewFocus(newFocus)
                } else if (oldFocus is ReactEditText && keyboardInfos.indexOfKey(oldFocus.id) >= 0) {
                    viewBlur(oldFocus)
                } else {
                    //失去焦点时，
                    val keyboardContainer = getKeyboardContainer(view)
                    if (newFocus == null && keyboardContainer?.isShowing() == true) {
                        viewBlur(view)
                    }
                }
            }
        }
    }

    companion object {
        const val NAME = "XRNKeyboard"
    }
}
