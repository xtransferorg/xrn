package xrn.modules.navigation.reactnative.handler

import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.handler.base.BaseActionHandler


class GoBackActionHandler : BaseActionHandler() {

    override fun handle(originAction: NavigationAction): Boolean {
        if (activityList.size <= 1) {
            return false
        }

        topActivity?.finish()

        return true
    }

}