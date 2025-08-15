package xrn.modules.navigation.kotlin

import xrn.modules.navigation.kotlin.bean.NavigationStateHolder

object Utils {

    fun getNavigationState(activity: Any?): NavigationStateHolder? {
        if (activity != null && activity is NavigationStateHolderProvider) {
            return activity.getNavigationStateHolder()
        }

        return null
    }

}