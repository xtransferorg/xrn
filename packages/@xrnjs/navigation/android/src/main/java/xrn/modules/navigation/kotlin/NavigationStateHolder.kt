package xrn.modules.navigation.kotlin

import xrn.modules.navigation.kotlin.bean.NavigationStateHolder

interface NavigationStateHolderProvider {
    fun getNavigationStateHolder(): NavigationStateHolder
}