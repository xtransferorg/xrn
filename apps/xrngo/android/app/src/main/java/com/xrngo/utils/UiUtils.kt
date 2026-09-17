package com.xrngo.utils

import androidx.core.content.ContextCompat
import com.blankj.utilcode.util.Utils
import xrn.modules.loading.R

object UiUtils {

    val retryText: String
        get() = ContextCompat.getString(
            Utils.getApp(),
            R.string.error_boundary_retry
        )

    val networkErrorText: String
        get() = ContextCompat.getString(
            Utils.getApp(),
            R.string.error_boundary_network_error
        )

}