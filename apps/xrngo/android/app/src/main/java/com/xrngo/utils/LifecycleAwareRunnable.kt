package com.xrngo.utils

import android.os.Handler
import android.os.Looper
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner

/**
 * 感知生命周期的 Runnable
 * Runnable必须通过 {@link #getHandler} 返回的 Handler 发送 Runnable
 * @see getHandler
 */
class LifecycleAwareRunnable(lifecycle: Lifecycle?, private val runnable: Runnable?): DefaultLifecycleObserver, Runnable {

    companion object {
        private val handler = Handler(Looper.getMainLooper())

        fun getHandler(): Handler {
            return handler
        }
    }

    init {
        lifecycle?.addObserver(this)
    }

    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        handler.removeCallbacks(this)
    }

    override fun run() {
        runnable?.run()
    }

}