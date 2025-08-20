package xrn.modules.debugtools.action

import android.app.Activity

/**
 * 开发面板每个 Item
 */
interface IAction {

    companion object {
        /**
         * 作用范围：开发环境下DEBUG包
         */
        const val SCOPE_DEV_DEBUG = 0x01
        /**
         * 作用范围：开发环境下Release包
         */
        const val SCOPE_DEV_RELEASE = 0x02
    }

    val TAG: String
        get() = this.javaClass.simpleName

    /**
     * 名称
     */
    fun name(): String

    /**
     * 作用范围
     * 默认只在开发环境下DEBUG包显示
     */
    fun scope(): Int = SCOPE_DEV_DEBUG

    /**
     * 执行操作
     */
    fun doAction()
}