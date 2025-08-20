package xrn.modules.debugtools

import xrn.modules.debugtools.action.IVisulation

object DataHost {
    var getCodePushUrl: (() -> String)? = null

    var getEnvName: (() -> String)? = null

    var getVisulationInstance: (() -> IVisulation)? = null
}