package xrn.modules.navigation

import android.app.Activity
import xrn.modules.navigation.kotlin.NavHelper
import xrn.modules.navigation.kotlin.RNContainerActivityClazzFactory
import xrn.modules.navigation.kotlin.exception.GlobalExceptionHandler
import xrn.modules.navigation.kotlin.exception.NavigationExceptionHandler
import xrn.modules.navigation.reactnative.NavigationRestorer
import xrn.modules.navigation.reactnative.NavigationRoutingTable


object Navigation {

    fun initialize(
        activityClazzFactory: RNContainerActivityClazzFactory,
        exceptionHandler: NavigationExceptionHandler? = null
    ) {
        NavHelper.activityClazzFactory = activityClazzFactory

        GlobalExceptionHandler.setHandler(exceptionHandler)

        // initializeInternal()
    }

    private fun initializeInternal() {
        NavigationRoutingTable.initialize()
        NavigationRestorer.initialize()
    }

    fun tryRestoringRoutes(activity: Activity): Boolean {
        return NavigationRestorer.tryRestoringRoutes(activity)
    }

}