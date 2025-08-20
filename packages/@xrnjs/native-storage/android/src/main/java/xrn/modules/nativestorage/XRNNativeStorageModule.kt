package xrn.modules.nativestorage

import com.blankj.utilcode.util.SPUtils
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.lang.Error

class XRNNativeStorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }


    @ReactMethod
    fun getItem(key: String?, promise: Promise) {
        if (key.isNullOrBlank()) {
            promise.resolve(null)
        } else {
            val value = SPUtils.getInstance(SP_NAME).getString(key)
            promise.resolve(value)
        }

    }

    /**
     * 获取 SP 值
     * 同步方法
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getItemSync(key: String?): String {
        return if (key.isNullOrBlank()) {
            ""
        } else {
            val value = SPUtils.getInstance(SP_NAME).getString(key)
            value ?: ""
        }
    }

    @ReactMethod
    fun setItem(key: String?, value: String?, promise: Promise) {
        if (key.isNullOrBlank()) {
            promise.reject(Error("Key不允许为空"))
        } else {
            SPUtils.getInstance(SP_NAME).put(key, value, true)
            promise.resolve(true)
        }
    }

    /**
     * 设置 SP 值
     * 同步方法，iOS 不支持返回 boolean 类型，所以统一返回 String 类型
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setItemSync(key: String?, value: String?): String {
        return if (key.isNullOrBlank()) {
            "false"
        } else {
            SPUtils.getInstance(SP_NAME).put(key, value ?: "", true)
            "true"
        }
    }

    @ReactMethod
    fun removeItem(key: String?, promise: Promise) {
        if (key.isNullOrBlank()) {
            promise.reject(Error("Key不允许为空"))
        } else {
            SPUtils.getInstance(SP_NAME).remove(key, true)
            promise.resolve(true)
        }
    }

    /**
     * 删除 SP 值
     * 同步方法，iOS 不支持返回 boolean 类型，所以统一返回 String 类型
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun removeItemSync(key: String?): String {
        return if (key.isNullOrBlank()) {
            "false"
        } else {
            SPUtils.getInstance(SP_NAME).remove(key, true)
            "true"
        }
    }

    companion object {
        private const val NAME = "XRNNativeStorageModule"

        const val SP_NAME = "NativeStorageModule"
    }
}
