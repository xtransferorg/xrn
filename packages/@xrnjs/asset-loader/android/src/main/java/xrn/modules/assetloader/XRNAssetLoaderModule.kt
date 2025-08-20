package xrn.modules.assetloader

import android.util.Log
import com.blankj.utilcode.util.FileUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileFilter
import java.io.FileInputStream
import java.io.IOException
import java.io.InputStream
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class XRNAssetLoaderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return MODULE_NAME
    }

    /**
     * 判断当前图片资源文件是否存在
     * 注解参数 isBlockingSynchronousMethod = true 表示是同步方法
     *
     * @param filePath 文件绝对路径
     * @return
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isFileExist(filePath: String?): Boolean {
        if (filePath == null || filePath === "") {
            Log.e("isFileExist:", "filePath路径错误")
            return false
        }
        val imageFile = File(filePath.replace("file://", ""))
        return imageFile.exists()
    }

    /**
     * 搜索JSBundle文件所在目录下的所有drawable资源文件
     *
     * @param jsBundleFilePath
     * @param callback         回传RN所有drawable资源文件路径
     */
    @ReactMethod
    fun searchDrawableFile(jsBundleFilePath: String?, callback: Callback) {
        if (jsBundleFilePath == null || jsBundleFilePath === "") {
            Log.e("searchDrawableFile:", "jsBundleFilePath路径错误")
            return
        }
        val params = Arguments.createArray()
        // jsbundle 文件
        val bundleFile = File(jsBundleFilePath)
        // jsbundle 文件所在目录
        val bundleFileDir = bundleFile.parentFile
        // bundleFileDir 是文件目录
        if (bundleFileDir.isDirectory) {
            val fileFilter = FileFilter { pathname: File? ->
                (pathname != null && pathname.name.startsWith("drawable") && pathname.isDirectory)
            }
            // 过滤出 JSBundle 文件目录下的所有 drawable 文件夹
            val drawableDirs = bundleFileDir.listFiles(fileFilter)
            if (drawableDirs != null) {
                // 遍历drawableDirs，取出 drawable 目录文件夹
                for (dir in drawableDirs) {
                    // 获取drawable文件夹的绝对路径
                    val drawablePath = dir.absolutePath

                    // 拿到 drawable 目录下的所有文件名称
                    val files = dir.list()
                    for (file in files) {
                        // 从rn图片加载源码中的drawableFolderInBundle方法，我们知道文件以 file:/// 开头
                        // E.g. 'file:///sdcard/bundle/assets/AwesomeModule/icon@2x.png'
                        params.pushString("file://" + drawablePath + File.separator + file)
                    }
                }
            }
        }
        callback.invoke(params)
    }

    /**
     * react-native-svg 中会用到该方法
     */
    @ReactMethod
    fun getCodePushRawResource(jsBundlePath: String?, fileName: String?, promise: Promise) {
        if (jsBundlePath == null || jsBundlePath === "") {
            Log.e("searchDrawableFile:", "jsBundleFilePath路径错误")
            return
        }
        val context = reactApplicationContext
        val bundleFileDir = File(jsBundlePath).parentFile
        var filePath: String? = null
        if (bundleFileDir!=null && bundleFileDir.exists() && bundleFileDir.isDirectory) {
            val fileFilter = FileFilter { pathname: File? ->
                (pathname != null && pathname.name.startsWith("raw")
                        && pathname.isDirectory)
            }
            val drawableDirs = bundleFileDir.listFiles(fileFilter)
            if (drawableDirs != null) {
                for (dir in drawableDirs) {
                    val drawablePath = dir.absolutePath
                    val files = dir.list()
                    for (file in files) {
                        if (file.equals(fileName)) {
                            filePath =  drawablePath + File.separator + file
                            break
                        }
                    }
                }
            }
        }

        if (filePath != null && FileUtils.isFileExists(filePath)) {
            var stream: InputStream? = null
            try {
                stream = FileInputStream(filePath)
                val reader = InputStreamReader(stream, StandardCharsets.UTF_8)
                val buffer = CharArray(DEFAULT_BUFFER_SIZE)
                val builder = StringBuilder()
                var n: Int
                while (reader.read(buffer, 0, DEFAULT_BUFFER_SIZE).also {
                        n = it
                    } != EOF) {
                    builder.append(buffer, 0, n)
                }
                val result = builder.toString()
                promise.resolve(result)
                return
            } catch (error: IOException) {
                promise.reject("raw文件读取失败")
            } finally {
                try {
                    stream?.close()
                } catch (ioe: IOException) {
                    // ignore
                    promise.reject("raw文件读取失败")
                }
            }
        }
        promise.resolve(null)
    }

    companion object {
        private const val EOF = -1
        private const val DEFAULT_BUFFER_SIZE = 1024 * 4
        private const val MODULE_NAME = "RNPAssetsLoad"
    }

}
