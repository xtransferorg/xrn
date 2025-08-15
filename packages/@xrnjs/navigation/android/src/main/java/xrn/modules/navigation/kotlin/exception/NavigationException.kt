package xrn.modules.navigation.kotlin.exception

import xrn.modules.navigation.kotlin.NavHelper

abstract class NavigationException(
    override val message: String,
    open val target: NavHelper.ModuleInitialPayload,
    open val source: NavHelper.ModuleInitialPayload? = null,
) : RuntimeException(message)