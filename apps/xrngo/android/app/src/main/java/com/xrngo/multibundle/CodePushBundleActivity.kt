package com.xrngo.multibundle

import android.os.Bundle
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.microsoft.codepush.react.SettingsManager
import xrn.modules.navigation.kotlin.BaseRNContainerActivity

open class CodePushBundleActivity : BaseRNContainerActivity() {

    val listener: ReactInstanceEventListener by lazy {
        object : ReactInstanceEventListener {
            override fun onReactContextInitialized(context: ReactContext) {
                initializeUpdateAfterRestart()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initializeCodePush()
    }

    override fun onDestroy() {
        super.onDestroy()
        reactHost.removeReactInstanceEventListener(listener)
    }

    private fun initializeCodePush() {
        val reactHost = reactHost

        /*
        * CodePush initializeUpdateAfterRestart 方法需要把 pendingPackage 的 loading 状态设置为 true，CodePush 回滚逻辑才能正常运行。
        *
        * 预加载模式下，我们不会真正的渲染页面。需要在 runApplication 之前调用 initializeUpdateAfterRestart 设置相关状态
        *
        * */

        /*
        * ReactInstanceManager createContext 方法未完成前代表 runJSBundle 未执行完。
        * runJSBundle 未执行完代表热更新未完成。
        * 需要监听 createContext 完成后再执行 initializeUpdateAfterRestart。
        *
        * */
        if (reactHost.currentReactContext == null) {
            reactHost.addReactInstanceEventListener(listener)
        } else {
            initializeUpdateAfterRestart()
        }
    }

    private fun initializeUpdateAfterRestart() {
        val codePush = CodePushUtils.getOrCreate(getBundleName())
            .getReactPackage()

        val settingsManager = ReflectUtils.reflect(codePush).field("mSettingsManager")
            .get<SettingsManager>()

        if (settingsManager.isPendingUpdate(codePush.runningPackageHash)) {
            codePush.initializeUpdateAfterRestart()
        }
    }

}