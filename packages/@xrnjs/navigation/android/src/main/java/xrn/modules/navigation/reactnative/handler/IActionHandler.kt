package xrn.modules.navigation.reactnative.handler

import xrn.modules.navigation.reactnative.bean.NavigationAction


interface IActionHandler {

    fun handle(originAction: NavigationAction): Boolean

}