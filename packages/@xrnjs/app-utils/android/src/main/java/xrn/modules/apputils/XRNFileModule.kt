package xrn.modules.apputils

import android.provider.MediaStore
import com.blankj.utilcode.util.LogUtils
import com.facebook.imagepipeline.core.ImagePipelineFactory
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class XRNFileModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val PKG_NAME = "XRNFileModule"
  }

  @ReactMethod
  fun clearFrescoCache(promise: Promise?) {
    val imagePipeline = ImagePipelineFactory.getInstance().imagePipeline
    imagePipeline.clearCaches()
    promise?.resolve(true)
  }

  @ReactMethod
  fun insertImageToPhotoLibrary(path: String?, fileName: String?, promise: Promise?) {
    if (path.isNullOrEmpty()) {
      promise?.resolve(false)
      return
    }
    try {
      val uri: String = MediaStore.Images.Media.insertImage(currentActivity?.contentResolver, path, fileName?: "", null)
      LogUtils.d(PKG_NAME, "insertImageToPhotoLibrary, uri=${uri}")
      promise?.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise?.reject(e)
    }
  }

  override fun getName(): String {
    return PKG_NAME
  }

}
