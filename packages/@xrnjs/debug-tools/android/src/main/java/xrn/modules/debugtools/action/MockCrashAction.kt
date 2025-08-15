package xrn.modules.debugtools.action

import com.blankj.utilcode.util.ThreadUtils

class MockCrashAction: IAction {

    override fun name(): String {
        return "NativeCrash"
    }

    override fun doAction() {
        ThreadUtils.runOnUiThread {
            throw RuntimeException("Android Native Crash for Test")
        }
    }
}