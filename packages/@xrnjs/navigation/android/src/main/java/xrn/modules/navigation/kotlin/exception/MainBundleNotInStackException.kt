package xrn.modules.navigation.kotlin.exception

import xrn.modules.navigation.kotlin.NavHelper.ModuleInitialPayload

class MainBundleNotInStackException :
    NavigationException("Main bundle not in stack!", ModuleInitialPayload(""))