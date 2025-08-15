package xrn.modules.debugtools.view

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.preference.PreferenceManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.XRNDebugToolsModule.databinding.ActivityXtDevQrcodeScanBinding
import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.ToastUtils
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.camera.CameraSettings
import org.json.JSONException
import org.json.JSONObject
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.devsupport.XDevInternalSettings
import xrn.modules.multibundle.devsupport.XPackageConnectionSettings

/**
 * Dev面板二维码扫描页面
 * 该页面是二维码扫描相关功能的分发页面，目前支持：
 * 1. 一键启动中 bundle host 设置
 */
class XTDevQRCodeScanActivity: AppCompatActivity() {

    lateinit var binding: ActivityXtDevQrcodeScanBinding

//    private var bundleName: String = ""

    companion object {
        const val CAMERA_REQUEST_CODE = 101

        const val ACTION_SET_BUNDLE_HOST = "action_set_bundle_host"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityXtDevQrcodeScanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initData(intent)
        initScan()

    }


    override fun onResume() {
        super.onResume()
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            binding.vScan.resume()
            startScan(0)
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.CAMERA), CAMERA_REQUEST_CODE)
        }

    }

    override fun onPause() {
        super.onPause()
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            binding.vScan.pause()
        }
    }

    private fun initData(intent: Intent?) {
//        bundleName = intent?.getStringExtra("bundleName") ?: ""
    }

    private fun initScan() {
        binding.vScan.setStatusText("二维码扫描")
        val cameraSettings = CameraSettings()
        binding.vScan.cameraSettings = cameraSettings
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                binding.vScan.resume()
                startScan(0)
            } else {
                ToastUtils.showShort("请授予相机权限")
                finish()
            }
        }
    }

    private fun startScan(delay: Long) {
        if (delay > 0) {
            binding.vScan.postDelayed({
                binding.vScan.decodeSingle { result ->
                    dispatchScanResult(result)
                }
            }, delay)
        } else {
            binding.vScan.decodeSingle { result ->
                dispatchScanResult(result)
            }
        }
    }

    /**
     * 分发扫描结果
     */
    private fun dispatchScanResult(result: BarcodeResult) {
        val text = result.text
        //处理 json 格式数据
        var handled = handleJson(text)


        if (handled) {
            finish()
        } else {
            ToastUtils.showShort("未识别的二维码：$text")
            startScan(1500)
        }
    }

    private fun handleJson(text: String): Boolean {
        var handled = false
        try {
            val json = JSONObject(text)
            val action = json.optString("action")
            val content = json.optString("content")
            if (ACTION_SET_BUNDLE_HOST == action) {
                handled = setBundleHost(content)
            }
        } catch (e: JSONException) {
            e.printStackTrace()
        }
        return handled
    }

    fun setDebugServerIP(host: String?) {
        val sp = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        sp.edit().putString(XPackageConnectionSettings.PREFS_DEBUG_SERVER_IP_KEY, host).apply()
    }


    /**
     * 修改 bundle host
     */
    private fun setBundleHost(content: String): Boolean {
        var handled = false
        try {
            val uri = Uri.parse(content)
            var host = ""
            if (uri.scheme == "xrn") {
                host = uri.host ?: ""
                setDebugServerIP(host)
                val bundleName = BundleInfoManager.findBundleInfoByPort(uri.port)?.bundleName
                if (bundleName.isNullOrEmpty()) {
                    ToastUtils.showShort("未找到对应的 bundleName")
                    return false
                }
                XDevInternalSettings.instance(bundleName)?.setBundleDebugEnabled(true)
                ToastUtils.showShort("ip地址绑定成功，重启APP生效！")
                Handler(
                    Looper.getMainLooper()).postDelayed({
                    AppUtils.exitApp()
                }, 1000)
                handled = true
            } else {
                ToastUtils.showShort("setBundleHost error:content=$content")
            }

        } catch (e: Exception) {
            e.printStackTrace()
            ToastUtils.showShort("setBundleHost error:content=$content")
        }
        return handled
    }

}