package xrn.modules.multibundle

import android.content.Context

object Utils {

    const val TAG = "XRN-MultiBundle"


    /**
     * True值断言
     * @param value 布尔值
     * @param msg 异常msg
     */
    fun assertTrue(value: Boolean, msg: String?) {
        if (!value) {
            throw Error(msg)
        }
    }

    /**
     * False值断言
     * @param value 布尔值
     * @param msg 异常msg
     */
    fun assertFalse(value: Boolean, msg: String) {
        if (value) {
            throw Error(msg)
        }
    }

    /**
     * 判断assets文件是否存在
     * @param fileName 相对于 assets 目录的相对路径
     */
    fun isAssetsFileExist(context: Context?, dir: String?, fileName: String?): Boolean {
        val fileList = context?.assets?.list(dir ?: "")
        return fileList?.contains(fileName ?: "") == true
    }

}