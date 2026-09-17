package xrn.modules.keyboard.inputmethod.handler

import android.content.Context
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.os.Build
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.widget.EditText
import android.widget.TextView
import xrn.modules.keyboard.R
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ScreenUtils
import com.blankj.utilcode.util.SizeUtils
import xrn.modules.keyboard.inputmethod.AmountInfo
import xrn.modules.keyboard.inputmethod.KEYBOARD_TYPE_AMOUNT
import xrn.modules.keyboard.inputmethod.Keyboard
import xrn.modules.keyboard.inputmethod.KeyboardContainer
import xrn.modules.keyboard.inputmethod.KeyboardInfo
import java.lang.invoke.MethodHandles

class AmountKeyboardHandler(context: Context): IKeyboardTypeHandler {

    override var keyboardContainer: KeyboardContainer? = null

    override fun onDetach(container: KeyboardContainer?) {
        val keyboardInfo = container?.curKeyboardInfo
        container?.curEditView?.removeTextChangedListener((keyboardInfo?.data as? AmountInfo)?.watcher)
        keyboardContainer = null
    }

    override fun onAttach(container: KeyboardContainer?) {
        keyboardContainer = container
        val keyboardInfo = container?.curKeyboardInfo
        if (keyboardInfo?.data is AmountInfo && keyboardInfo.keyboardType == KEYBOARD_TYPE_AMOUNT) {
            if (keyboardInfo.data.watcher == null) {
                keyboardInfo.data.watcher = object : TextWatcher {
                    private var hasContent: Boolean? = null
                    override fun beforeTextChanged(
                        s: CharSequence?,
                        start: Int,
                        count: Int,
                        after: Int
                    ) {
                    }

                    override fun onTextChanged(
                        s: CharSequence?,
                        start: Int,
                        before: Int,
                        count: Int
                    ) {
                        val curHasContent = s.isNullOrEmpty()
                        if (curHasContent != hasContent) {
                            hasContent = curHasContent
                            updateFastData(container)
                        }
                    }

                    override fun afterTextChanged(s: Editable?) {
                    }

                }
            }
            container.curEditView?.let {
                removeTextWatcherToTextViewSuper(it, keyboardInfo.data.watcher)
                addTextWatcherToTextViewSuper(it, keyboardInfo.data.watcher)
            }
            updateFastData(container)
        }
    }


    private fun addTextWatcherToTextViewSuper(editText: EditText?, watcher: TextWatcher?) {
        if (editText == null || watcher == null) {
            return
        }
        try {
            val field = TextView::class.java.getDeclaredField("mListeners")
            field.isAccessible = true
            val list = field.get(editText) as? ArrayList<TextWatcher> ?: arrayListOf()
            list.add(watcher)
            field.set(editText, list)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun removeTextWatcherToTextViewSuper(editText: EditText?, watcher: TextWatcher?) {
        if (editText == null || watcher == null) {
            return
        }
        try {
            val field = TextView::class.java.getDeclaredField("mListeners")
            field.isAccessible = true
            val list = field.get(editText) as? ArrayList<TextWatcher> ?: arrayListOf()
            list.remove(watcher)
            field.set(editText, list)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun updateFastData(container: KeyboardContainer?) {
        val keyboard = container?.curKeyboard
        val keyboardInfo = container?.curKeyboardInfo
        val keyList = keyboard?.keys as? ArrayList<Keyboard.Key>

        val hasContent = !container?.curEditView?.text.isNullOrEmpty()
        //如果有内容，则显示快捷数据，否则显示初始化快捷数据
        val dataList = if (hasContent) {
            (keyboardInfo?.data as? AmountInfo)?.fastData
        } else {
            (keyboardInfo?.data as? AmountInfo)?.initFastData
        }

        var doneDesc = (keyboardInfo?.data as? AmountInfo)?.doneDesc
        if (doneDesc.isNullOrBlank()) {
            doneDesc = "完成"
        }

        keyList?.let { list ->
            val tempList = ArrayList<Keyboard.Key>(list)
            keyList.clear()

            val row = Keyboard.Row(keyboard)
            row.defaultHeight = SizeUtils.dp2px(56.0f)

            val fastDataSize = dataList?.size ?: 0
            val topRowCount = if (fastDataSize < 2) 3 else fastDataSize + 1

            var customKey: Keyboard.Key
            for (index in 0 until topRowCount) {
                customKey = Keyboard.Key(row)
                customKey.width = ScreenUtils.getScreenWidth() / topRowCount
                customKey.x = ScreenUtils.getScreenWidth() / topRowCount * index
                customKey.y = 0
                if (index == topRowCount -1) {
                    customKey.label = doneDesc
                    customKey.codes = intArrayOf(66) // 自定义keyCode
                    keyList.add(customKey)
                } else if (index < fastDataSize && dataList?.get(index)?.isNotBlank() == true) {
                    val fastData = dataList.get(index)
                    customKey.label = fastData
                    customKey.text = fastData
                    customKey.codes = intArrayOf(KEYCODE_FAST_DATA) // 自定义keyCode
                    keyList.add(customKey)
                } else {
                    customKey.label = ""
                    customKey.codes = intArrayOf(KEYCODE_FAST_DATA_UNKNOWN) // 自定义keyCode
                    keyList.add(customKey)
                }
            }

            for (temKey in tempList) {
                if (temKey.y != 0) {
                    if (temKey.codes.get(0) == KeyEvent.KEYCODE_NUMPAD_DOT) {
                        val decimalType = (keyboardInfo?.data as? AmountInfo)?.decimalType
                        if (decimalType.isNullOrEmpty()) {
                            temKey.label = ""
                            temKey.text = ""
                        } else {
                            temKey.label = decimalType
                            temKey.text = decimalType
                        }
                    }
                    keyList.add(temKey)
                }
            }
            keyboard.resetGridNeighbors()
            container.keyboardView.keyboard = keyboard
            container.keyboardView.invalidateAllKeys()
            container.keyboardView.invalidate()
        }
    }

    private val mAmountTopKeyBackground: Drawable = context.getDrawable(R.drawable.bg_amount_keyboard_top_key)!!
    private val mDoneKeyBackground: Drawable = context.getDrawable(R.drawable.bg_keyboard_done_key)!!

    override fun getKeyBackground(key: Keyboard.Key?, defaultKeyBackground: Drawable?): Drawable? {
        if (keyboardContainer?.curKeyboardInfo?.keyboardType == KEYBOARD_TYPE_AMOUNT) {
            if (key?.codes?.get(0) == KeyEvent.KEYCODE_NUMPAD_DOT || key?.codes?.get(0) == KeyEvent.KEYCODE_DEL || key?.codes?.get(0) == KEYCODE_UNKNOWN) { //小数点 / 删除
                return null
            } else if ((key?.codes?.get(0) ?: 0) in intArrayOf(
                    KEYCODE_FAST_DATA,
                    KEYCODE_FAST_DATA_UNKNOWN,
                )
            ) { //快捷数据
                return mAmountTopKeyBackground
            } else if ((key?.codes?.get(0) ?: 0) == KeyEvent.KEYCODE_ENTER) { //完成
                return mDoneKeyBackground
            }
        }
        return defaultKeyBackground
    }

    override fun getPaint(key: Keyboard.Key?, paint: Paint?): Paint? {

        if (keyboardContainer?.curKeyboardInfo?.keyboardType == KEYBOARD_TYPE_AMOUNT) {
            val code = (key?.codes?.get(0) ?: 0)
            if (code == KEYCODE_FAST_DATA || code == KEYCODE_FAST_DATA_UNKNOWN) {
                paint?.textSize = SizeUtils.dp2px(16.0f).toFloat()
                paint?.color = Color.parseColor("#181721")
                paint?.setTypeface(Typeface.DEFAULT_BOLD)
            } else if (code == 66) {
                paint?.textSize = SizeUtils.dp2px(16.0f).toFloat()
                paint?.color = Color.parseColor("#0775CF")
                paint?.setTypeface(Typeface.DEFAULT_BOLD)
            }
        }
        return paint
    }

    override fun onPress(primaryCode: Int) {
    }

    override fun onRelease(primaryCode: Int) {
    }

    override fun onKey(primaryCode: Int, keyCodes: IntArray?) {
        performKey(primaryCode)
    }

    override fun onText(text: CharSequence?) {
        keyboardContainer?.curEditView?.let { view ->
            val start = view.selectionStart
            val end = view.selectionEnd
            view.text?.replace(start, end, text)

        }
    }

    override fun swipeLeft() {
    }

    override fun swipeRight() {
    }

    override fun swipeDown() {
        keyboardContainer?.hideKeyboard()
    }

    override fun swipeUp() {
    }

    private fun performKey(code: Int) {
        keyboardContainer?.curEditView?.let {
            val start = it.selectionStart
            val end = it.selectionEnd
            when {
                code == KEYCODE_UNKNOWN -> {
                }
                code == KeyEvent.KEYCODE_DEL -> {
                    it.onKeyDown(KeyEvent.KEYCODE_DEL, KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL))
                }
                code == KeyEvent.KEYCODE_ENTER -> {
                    it.onKeyDown(KeyEvent.KEYCODE_ENTER, KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                    keyboardContainer?.hideKeyboard()
                }
                else -> {}
            }
        }
    }


    companion object {

        /**
         * 未知 keycode，点击不处理
         */
        const val KEYCODE_UNKNOWN = -1000
        /**
         * 所有快捷数据
         */
        const val KEYCODE_FAST_DATA = -1099

        /**
         * 未知快捷数据
         * 用来占用空间，无实际显示
         */
        const val KEYCODE_FAST_DATA_UNKNOWN = -1098

        /**
         * 用于数字金额键盘，点击输入"0"
         */
        const val KEYCODE_AMOUNT_0 = -1001

        /**
         * 用于数字金额键盘，点击输入"00"
         */
        const val KEYCODE_AMOUNT_00 = -1002

        /**
         * 用于数字金额键盘，点击输入"000"
         */
        const val KEYCODE_AMOUNT_000 = -1003

        /**
         * 用于数字金额键盘，点击输入"10"
         */
        const val KEYCODE_AMOUNT_10 = -1011

        /**
         * 用于数字金额键盘，点击输入"100"
         */
        const val KEYCODE_AMOUNT_100 = -1012

        /**
         * 用于数字金额键盘，点击输入"1000"
         */
        const val KEYCODE_AMOUNT_1000 = -1013
    }
}