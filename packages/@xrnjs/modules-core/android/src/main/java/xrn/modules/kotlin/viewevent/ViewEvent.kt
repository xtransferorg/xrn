package xrn.modules.kotlin.viewevent

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import xrn.modules.kotlin.types.JSTypeConverter
import xrn.modules.kotlin.types.putGeneric


fun interface ViewEventCallback<T> {
  operator fun invoke(arg: T)
}

open class ViewEvent<T>(
  private val name: String,
  private val view: View,
  private val coalescingKey: CoalescingKey<T>?
) : ViewEventCallback<T> {

  override operator fun invoke(arg: T) {
      val reactContext = view.context as ReactContext

      val event = convertEventBody(arg)

      reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(
          view.id,
          name,
          event
      )
  }

  private fun convertEventBody(arg: T): WritableMap? {
    return when (val converted = JSTypeConverter.convertToJSValue(arg)) {
      is Unit, null -> null
      is WritableMap -> converted
      else -> JSTypeConverter.DefaultContainerProvider.createMap().apply {
        putGeneric("payload", converted)
      }
    }
  }
}
