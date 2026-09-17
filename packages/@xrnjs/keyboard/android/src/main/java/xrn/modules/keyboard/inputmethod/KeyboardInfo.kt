package xrn.modules.keyboard.inputmethod

import android.content.Context
import android.text.TextWatcher
import android.view.View
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.ReadableMap

/**
 * 系统键盘
 */
const val KEYBOARD_TYPE_SYSTEM = "system"

/**
 * 数字金额键盘
 */
const val KEYBOARD_TYPE_AMOUNT = "amount"

/**
 * 快捷数据，最大数量
 */
const val KEYBOARD_AMOUNT_FAST_DATA_MAX_ITEM = 4;

/**
 * 键盘信息
 * @param reactTag 输入框 reactTag
 * @param keyboardType 键盘类型
 * @param data 键盘类型对应的数据
 */
data class KeyboardInfo<T>(val reactTag: Int, val scrollTag:Int, val keyboardType: String, val data: T?)

/**
 * 数字金额键盘需要的数据
 */
data class AmountInfo(val decimalType: String?, val initFastData: List<String>?, val fastData: List<String>?, val doneDesc: String?, var watcher: TextWatcher? = null)


private fun <T> returnOrNull(callable: () -> T?): T? {
    return try {
        callable()
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}
/**
 * 转换成 KeyboardInfo
 */
fun convertKeyboardInfo(keyboardType: String,
                                tag: Int,
                                scrollTag: Int,
                                keyboardInfo: ReadableMap?): KeyboardInfo<*>? {
    return when(keyboardType) {
        KEYBOARD_TYPE_AMOUNT -> {
            val decimalType = returnOrNull { keyboardInfo?.getString("decimalType") }
            val initFastDataArray = returnOrNull { keyboardInfo?.getArray("initFastDataArray") }
            val initFastDataList = ArrayList<String>()
            for (i in 0 until (initFastDataArray?.size() ?: 0).coerceAtMost(KEYBOARD_AMOUNT_FAST_DATA_MAX_ITEM)) {
                val item = returnOrNull { initFastDataArray?.getString(i) }
                if (item?.isNotBlank() == true) {
                    initFastDataList.add(item)
                }
            }
            val fastDataArray = returnOrNull { keyboardInfo?.getArray("fastDataArray") }
            val fastDataList = ArrayList<String>()
            for (i in 0 until (fastDataArray?.size() ?: 0).coerceAtMost(KEYBOARD_AMOUNT_FAST_DATA_MAX_ITEM)) {
                val item = returnOrNull { fastDataArray?.getString(i) }
                if (item?.isNotBlank() == true) {
                    fastDataList.add(item)
                }
            }
            val doneDesc = returnOrNull { keyboardInfo?.getString("doneDesc") }
            val amountInfo = AmountInfo(decimalType, initFastDataList, fastDataList, doneDesc)
            KeyboardInfo(tag, scrollTag, keyboardType, amountInfo)
        }
        else -> null
    }
}

/**
 * 显示系统输入法
 */
fun View.showSystemInputMethod() {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    imm.showSoftInput(this, InputMethodManager.SHOW_IMPLICIT)
}

/**
 * 隐藏系统输入法
 */
fun View.hideSystemInputMethod() {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    imm.hideSoftInputFromWindow(windowToken, 0)
}
