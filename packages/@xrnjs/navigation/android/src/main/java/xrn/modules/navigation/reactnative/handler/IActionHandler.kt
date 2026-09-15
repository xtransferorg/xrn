package xrn.modules.navigation.reactnative.handler

import android.app.Activity
import xrn.modules.navigation.reactnative.bean.NavigationAction


interface IActionHandler {

    fun handle(currentActivity: Activity, originAction: NavigationAction): Boolean

}