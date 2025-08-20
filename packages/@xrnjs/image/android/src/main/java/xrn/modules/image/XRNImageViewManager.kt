package xrn.modules.image

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import xrn.modules.image.enums.ContentFit
import xrn.modules.image.enums.Priority
import xrn.modules.image.records.CachePolicy
import xrn.modules.image.records.ContentPosition
import xrn.modules.image.records.DecodeFormat
import xrn.modules.image.records.ImageTransition
import xrn.modules.kotlin.AppContext
import xrn.modules.kotlin.fromValue
import xrn.modules.kotlin.safeGetAny
import xrn.modules.kotlin.weak

class XRNImageViewManager : XRNBaseImageViewManager<ExpoImageViewWrapper>() {

    override fun getName(): String {
        return NAME
    }

    override fun createViewInstance(reactContext: ThemedReactContext): ExpoImageViewWrapper {
        return if (reactContext.currentActivity == null) {
            Log.e(
                "ExpoImage",
                "createViewInstance: reactContext.currentActivity is null, using ExpoImageViewWrapper"
            )
            ExpoImageViewWrapper(
                reactContext, AppContext(reactContext.reactApplicationContext.weak())
            )
        } else {
            ExpoImageViewWrapperReal(
                reactContext, AppContext(reactContext.reactApplicationContext.weak())
            )
        }
    }

    @ReactProp(name = "source")
    fun setSource(view: ExpoImageViewWrapper, sources: ReadableArray?) {
        view.sources = toImageSources(sources)
    }

    @ReactProp(name = "contentFit")
    fun setContentFit(view: ExpoImageViewWrapper, contentFit: String?) {
        view.contentFit = fromValue<ContentFit>(contentFit, ContentFit.Cover) { it.value }
    }

    @ReactProp(name = "placeholderContentFit")
    fun setPlaceholderContentFit(view: ExpoImageViewWrapper, placeholderContentFit: String?) {
        view.placeholderContentFit =
            fromValue<ContentFit>(placeholderContentFit, ContentFit.ScaleDown) { it.value }
    }

    @ReactProp(name = "contentPosition")
    fun setContentPosition(view: ExpoImageViewWrapper, contentPosition: ReadableMap) {
        view.contentPosition = ContentPosition().apply {
            top = contentPosition.safeGetAny("top")
            bottom = contentPosition.safeGetAny("bottom")
            right = contentPosition.safeGetAny("right")
            left = contentPosition.safeGetAny("left")
        }
    }

    @ReactProp(name = "blurRadius")
    fun setBlurRadius(view: ExpoImageViewWrapper, blurRadius: Int?) {
        view.blurRadius = blurRadius
    }

    @ReactProp(name = "transition")
    fun setTransition(view: ExpoImageViewWrapper, transition: ReadableMap?) {
        val duration = transition?.getInt("duration") ?: 0

        view.transition = ImageTransition(duration)
    }

    @ReactProp(name = "tintColor", customType = "Color")
    fun setTintColor(view: ExpoImageViewWrapper, tintColor: Int?) {
        view.tintColor = tintColor
    }

    @ReactProp(name = "placeholder")
    fun setPlaceholder(view: ExpoImageViewWrapper, placeholder: ReadableArray?) {
        view.placeholders = toImageSources(placeholder)
    }

    @ReactProp(name = "accessible")
    fun setAccessible(view: ExpoImageViewWrapper, accessible: Boolean?) {
        view.accessible = accessible == true
    }

    // BaseViewManager 统一处理了这个属性
    /*@ReactProp(name = "accessibilityLabel")
    fun setAccessibilityLabel(view: ExpoImageViewWrapper, accessibilityLabel: String?) {
        view.accessibilityLabel = accessibilityLabel
    }*/

    @ReactProp(name = "focusable")
    fun setFocusable(view: ExpoImageViewWrapper, focusable: Boolean?) {
        view.isFocusableProp = focusable == true
    }

    @ReactProp(name = "priority")
    fun setPriority(view: ExpoImageViewWrapper, priority: String?) {
        view.priority = fromValue<Priority>(priority, Priority.NORMAL) { it.value }
    }

    @ReactProp(name = "cachePolicy")
    fun setCachePolicy(view: ExpoImageViewWrapper, cachePolicy: String?) {
        view.cachePolicy = fromValue<CachePolicy>(cachePolicy, CachePolicy.DISK) { it.value }
    }

    @ReactProp(name = "recyclingKey")
    fun setRecyclingKey(view: ExpoImageViewWrapper, recyclingKey: String?) {
        view.recyclingKey = recyclingKey
    }

    @ReactProp(name = "allowDownscaling")
    fun setAllowDownscaling(view: ExpoImageViewWrapper, allowDownscaling: Boolean?) {
        view.allowDownscaling = allowDownscaling == true
    }

    @ReactProp(name = "autoplay")
    fun setAutoplay(view: ExpoImageViewWrapper, autoplay: Boolean?) {
        view.autoplay = autoplay == true
    }

    @ReactProp(name = "decodeFormat")
    fun setDecodeFormat(view: ExpoImageViewWrapper, decodeFormat: String?) {
        view.decodeFormat =
            fromValue<DecodeFormat>(decodeFormat, DecodeFormat.ARGB_8888) { it.value }
    }

    override fun setBorderColorInternal(view: ExpoImageViewWrapper, index: Int, color: Int?) {
        view.setBorderColor(index, color)
    }

    override fun setBorderWidthInternal(view: ExpoImageViewWrapper, index: Int, width: Float) {
        view.setBorderWidth(index, width)
    }

    override fun setBorderRadiusInternal(view: ExpoImageViewWrapper, index: Int, radius: Float) {
        view.setBorderRadius(index, radius)
    }

    override fun setBorderStyleInternal(view: ExpoImageViewWrapper, style: String?) {
        view.borderStyle = style
    }

    override fun onAfterUpdateTransaction(view: ExpoImageViewWrapper) {
        super.onAfterUpdateTransaction(view)
        view.rerenderIfNeeded(true)
    }

    override fun onDropViewInstance(view: ExpoImageViewWrapper) {
        super.onDropViewInstance(view)
        view.onViewDestroys()
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
        val eventTypeConstants =
            baseEventTypeConstants ?: HashMap()
        eventTypeConstants.putAll(
            MapBuilder.of(
                "onDisplay",
                MapBuilder.of("registrationName", "onDisplay"),
                "onLoadStart",
                MapBuilder.of("registrationName", "onLoadStart"),
                "onProgress",
                MapBuilder.of("registrationName", "onProgress"),
                "onLoad",
                MapBuilder.of("registrationName", "onLoad"),
                "onError",
                MapBuilder.of("registrationName", "onError"),
                "onLoadEnd",
                MapBuilder.of("registrationName", "onLoadEnd")
            )
        )
        return eventTypeConstants
    }

    companion object {
        private const val NAME = "XRNImageView"
    }

}
