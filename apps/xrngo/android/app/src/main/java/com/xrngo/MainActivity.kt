package com.xrngo

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import androidx.appcompat.app.AppCompatActivity
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ToastUtils
import com.xrngo.databinding.ActivitySplashBinding
import xrn.modules.navigation.kotlin.NavHelper.buildMainModuleIntent

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivitySplashBinding.inflate(
            LayoutInflater.from(
                this
            )
        )
        setContentView(binding.root)
        Handler(Looper.getMainLooper()).postDelayed({
            startXGoMainActivity()
        }, 500)
    }

    private fun startXGoMainActivity() {
        val mainIntent = buildMainModuleIntent(this, null)

        if (mainIntent == null) {
            LogUtils.e("跳转失败，主 Bundle 未注册！！！")
            ToastUtils.showLong("跳转失败，主 Bundle 未注册！！！")
        }
        startActivity(mainIntent)
        overridePendingTransition(0, 0)
        finish()
    }
}
