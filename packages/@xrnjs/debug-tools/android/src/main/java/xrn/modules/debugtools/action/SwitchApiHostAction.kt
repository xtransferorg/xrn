package xrn.modules.debugtools.action

import android.app.Activity
import android.app.AlertDialog
import android.content.DialogInterface
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import com.XRNDebugToolsModule.R
import com.XRNDebugToolsModule.databinding.ItemChangeEnvApiHostBinding
import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.SPUtils
import com.blankj.utilcode.util.ToastUtils
import com.facebook.common.logging.FLog
import com.google.android.material.textfield.TextInputEditText
import com.xrn.multibundle.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import xrn.modules.debugtools.Constants
import xrn.modules.debugtools.DataHost
import xrn.modules.debugtools.Utils
import xrn.modules.multibundle.bundle.BundleInfoManager
import java.io.IOException

/**
 * 切换环境
 */
class SwitchApiHostAction(val activity: Activity?): IAction {


    private val client by lazy { OkHttpClient() }

    private val codePushKeyMap = mutableMapOf<String, String>()

    override fun name(): String {
        return "切换环境"
    }

    override fun scope(): Int {
        return IAction.SCOPE_DEV_DEBUG.or(IAction.SCOPE_DEV_RELEASE)
    }

    override fun doAction() {
        showSwitchAPiHostDialog(activity)
    }

    /**
     * 显示切换环境弹窗
     */
    private fun showSwitchAPiHostDialog(context: Activity?) {
        if (context != null && !context.isFinishing) {
            val binding: ItemChangeEnvApiHostBinding = ItemChangeEnvApiHostBinding.inflate(
                LayoutInflater.from(context)
            )
            val inputTextView = binding.root.findViewById<TextInputEditText>(R.id.ed_env_input)
            val localDevValue = SPUtils.getInstance().getString("DEV_BASE_HOST")
            inputTextView.setText(
                if (localDevValue.isNullOrEmpty()) DataHost.getEnvName?.invoke() else localDevValue
            )
            AlertDialog.Builder(context).setTitle("切换环境").setView(binding.root)
                .setPositiveButton(
                    "确定",
                    DialogInterface.OnClickListener { _, _ ->
                        val inputText = inputTextView.text.toString()
                        if (inputText.isEmpty()) {
                            ToastUtils.showShort("请输入环境")
                            return@OnClickListener
                        }

                        if (!Utils.isValidUrlWithRegex(inputText)) {
                            ToastUtils.showShort("请正确的请求地址")
                            return@OnClickListener
                        }
                        SPUtils.getInstance().put("DEV_BASE_HOST", inputText, true)
                        ToastUtils.showShort("环境修改成功，正在获取CodePushKey")
                        requestBundleCodePushKey(inputText)
                    }).create().show()

        } else {
            FLog.e(
                "ReactNative",
                "Unable to launch change bundle location because react activity is not available"
            )
        }
    }


    /**
     * 请求 CodePushKey
     */
    private fun requestBundleCodePushKey(envUrl: String?) {
        codePushKeyMap.clear()
        val env = parseEnv(envUrl)
        val bundleList = BundleInfoManager.getAllBundleInfo()
        bundleList.forEach {
            codePushKeyMap[it.bundleName] = ""
        }

        CoroutineScope(Dispatchers.IO).launch {
            makeRequests(env) {
                handleRequestsResult(env)
            }
        }
    }

    /**
     * 解析 https://sitxt20.xtrfr.cn 为 sitxt20
     */
    private fun parseEnv(url: String?): String {
        val start = url?.indexOf("//") ?: -1
        if (start < 0) {
            return ""
        }
        val end = url?.indexOf(".", start + 2) ?: -1
        if (end < 0) {
            return ""
        }
        return url?.substring(start + 2, end) ?: ""
    }

    private fun buildDeploymentsUrl(bundleName: String, env: String): String {
        return "${DataHost.getCodePushUrl?.invoke()}/apps/$bundleName-android-$env/deployments"
    }



    private suspend fun makeRequests(env: String, onComplete: () -> Unit) = coroutineScope {
        val requests = codePushKeyMap.keys.map { bundleName ->
            async {
                requestDeployments(bundleName, env)
            }
        }
        requests.awaitAll()

        withContext(Dispatchers.Main) {
            onComplete()
        }
    }

    private fun requestDeployments(bundleName: String, env: String) {
        val url = buildDeploymentsUrl(bundleName, env)
        val request = Request.Builder().url(url)
            .header("Authorization", "Bearer Zd12T48nJdu710Zkj7f5xAIYVn7o4ksvOXqog").build()
        try {
            val response = client.newCall(request).execute()
            val responseString = response.body?.string() ?: ""
            handleResponse(bundleName, responseString)
        } catch (e: IOException) {
            LogUtils.i(TAG, "requestDeployments onFailure: ${e.message}")
        }
    }

    /**
     * 处理请求结果
     * 只做内存存储，全部成功再持久化存储
     */
    private fun handleResponse(bundleName: String, responseString: String) {
        LogUtils.e(TAG, "handleResponse: $responseString")
        try {
            val json = JSONObject(responseString)
            val deployments = json.get("deployments")
            if (deployments !is JSONArray) {
                Log.e(TAG, "json data format error")
                return
            }
            var codePushKey = ""
            for (index in 0 until deployments.length()) {
                val deployment = deployments.get(index)
                if (deployment is JSONObject) {
                    val name = deployment.get("name") as? String
                    val key = deployment.get("key") as? String
                    if ("Production" == name) {
                        codePushKey = key ?: ""
                        break
                    }
                } else {
                    continue
                }
            }
            if (codePushKeyMap.contains(bundleName)) {
                codePushKeyMap[bundleName] = codePushKey
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleRequestsResult(env: String) {
        val success = codePushKeyMap.none { it.value.isEmpty() }
        codePushKeyMap.forEach {
            SPUtils.getInstance(Constants.SP_NAME_DEV_SUPPORT).put("${it.key}-codepush-key", it.value, true)
        }

        if (success) {
            ToastUtils.showShort("CodePushKey 获取成功、需要重启APP")
            Handler(Looper.getMainLooper()).postDelayed({
                AppUtils.relaunchApp(true)
            }, 1000)
        } else {
            val invalidBundle = codePushKeyMap.filter { it.value.isEmpty() }.keys.toString()
            ToastUtils.showShort("部分 CodePushKey 获取失败 ${invalidBundle}")
            LogUtils.e(TAG, "获取到的所有 CodePushKey 为：$codePushKeyMap")
        }
    }
}