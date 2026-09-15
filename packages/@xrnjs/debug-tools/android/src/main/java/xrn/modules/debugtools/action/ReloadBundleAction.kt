package xrn.modules.debugtools.action

import xrn.modules.multibundle.view.RNContainerActivity

class ReloadBundleAction(val activity: RNContainerActivity?): IAction {

    override fun name(): String {
        return "Reload"
    }

    override fun doAction() {
        activity?.reactHost?.devSupportManager?.handleReloadJS()
    }
}