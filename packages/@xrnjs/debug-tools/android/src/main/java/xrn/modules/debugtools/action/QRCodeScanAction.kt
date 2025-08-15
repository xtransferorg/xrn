package xrn.modules.debugtools.action

import android.app.Activity
import android.content.Intent
import xrn.modules.debugtools.view.XTDevQRCodeScanActivity

/**
 * 二维码扫描
 * 目前支持的功能有：
 * 1.一键启动中bundle host 设置
 */
class QRCodeScanAction(val activity: Activity): IAction {

    override fun name(): String {
        return "二维码扫描"
    }

    override fun doAction() {
        val intent = Intent(activity, XTDevQRCodeScanActivity::class.java)
        activity.startActivity(intent)
    }
}