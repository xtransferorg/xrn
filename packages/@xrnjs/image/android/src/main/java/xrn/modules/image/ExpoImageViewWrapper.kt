package xrn.modules.image

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Handler
import android.view.View
import android.widget.FrameLayout
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import xrn.modules.image.enums.ContentFit
import xrn.modules.image.enums.Priority
import xrn.modules.image.records.CachePolicy
import xrn.modules.image.records.ContentPosition
import xrn.modules.image.records.DecodeFormat
import xrn.modules.image.records.ImageErrorEvent
import xrn.modules.image.records.ImageLoadEvent
import xrn.modules.image.records.ImageProgressEvent
import xrn.modules.image.records.ImageTransition
import xrn.modules.image.records.Source
import xrn.modules.image.svg.SVGPictureDrawable
import xrn.modules.kotlin.AppContext
import xrn.modules.kotlin.viewevent.EventDispatcher
import xrn.modules.kotlin.views.XRNView
import androidx.core.view.isVisible
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.github.penfeizhou.animation.gif.GifDrawable
import xrn.modules.kotlin.tracing.trace
import java.lang.ref.WeakReference

@SuppressLint("ViewConstructor")
open class ExpoImageViewWrapper(context: Context, appContext: AppContext) :
    XRNView(context, appContext) {
    protected val firstView = ExpoImageView(context)
    protected val secondView = ExpoImageView(context)

    /**
     * @returns the view which is currently active or will be used when both views are empty
     */
    protected val activeView: ExpoImageView
        get() {
            if (secondView.drawable != null) {
                return secondView
            }
            return firstView
        }

    internal val onLoadStart by EventDispatcher<Unit>()
    internal val onProgress by EventDispatcher<ImageProgressEvent>()
    internal val onError by EventDispatcher<ImageErrorEvent>()
    internal val onLoad by EventDispatcher<ImageLoadEvent>()
    internal val onDisplay by EventDispatcher<Unit>()

    internal var sources: List<Source> = emptyList()

    internal var placeholders: List<Source> = emptyList()

    internal var blurRadius: Int? = null
        set(value) {
            if (field != value) {
                shouldRerender = true
            }
            field = value
        }

    internal var transition: ImageTransition? = null

    internal var contentFit: ContentFit = ContentFit.Cover
        set(value) {
            field = value
            activeView.contentFit = value
            transformationMatrixChanged = true
        }

    internal var placeholderContentFit: ContentFit = ContentFit.ScaleDown
        set(value) {
            field = value
            activeView.placeholderContentFit = value
            transformationMatrixChanged = true
        }

    internal var contentPosition: ContentPosition = ContentPosition.center
        set(value) {
            field = value
            activeView.contentPosition = value
            transformationMatrixChanged = true
        }

    internal var tintColor: Int? = null
        set(value) {
            field = value
            // To apply the tint color to the SVG, we need to recreate the drawable.
            if (activeView.drawable is SVGPictureDrawable) {
                shouldRerender = true
            } else {
                activeView.setTintColor(value)
            }
        }

    internal var isFocusableProp: Boolean = false
        set(value) {
            field = value
            activeView.isFocusable = value
        }

    internal var accessible: Boolean = false
        set(value) {
            field = value
            setIsScreenReaderFocusable(activeView, value)
        }

    internal var accessibilityLabel: String? = null
        set(value) {
            field = value
            activeView.contentDescription = accessibilityLabel
        }

    var recyclingKey: String? = null
        set(value) {
            clearViewBeforeChangingSource = field != null && value != null && value != field
            field = value
        }

    internal var allowDownscaling: Boolean = true
        set(value) {
            field = value
            shouldRerender = true
        }

    internal var decodeFormat: DecodeFormat = DecodeFormat.ARGB_8888
        set(value) {
            field = value
            shouldRerender = true
        }

    internal var autoplay: Boolean = true

    internal var lockResource: Boolean = false

    internal var priority: Priority = Priority.NORMAL
    internal var cachePolicy: CachePolicy = CachePolicy.DISK

    fun setIsAnimating(setAnimating: Boolean) {
        // Animatable animations always start from the beginning when resumed.
        // So we check first if the resource is a GifDrawable, because it can continue
        // from where it was paused.
        when (val resource = activeView.drawable) {
            is GifDrawable -> setIsAnimating(resource, setAnimating)
            is Animatable -> setIsAnimating(resource, setAnimating)
        }
    }

    private fun setIsAnimating(resource: GifDrawable, setAnimating: Boolean) {
        if (setAnimating) {
            if (resource.isPaused) {
                resource.resume()
            } else {
                resource.start()
            }
        } else {
            resource.pause()
        }
    }

    private fun setIsAnimating(resource: Animatable, setAnimating: Boolean) {
        if (setAnimating) {
            resource.start()
        } else {
            resource.stop()
        }
    }

    /**
     * Whether the image should be loaded again
     */
    internal var shouldRerender = false

    /**
     * Whether the transformation matrix should be reapplied
     */
    protected var transformationMatrixChanged = false

    /**
     * Whether the view content should be cleared to blank when the source was changed.
     */
    protected var clearViewBeforeChangingSource = false


    /**
     * Allows `isScreenReaderFocusable` to be set on apis below level 28
     */
    protected fun setIsScreenReaderFocusable(view: View, value: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            view.isScreenReaderFocusable = value
        } else {
            ViewCompat.setAccessibilityDelegate(
                this, object : AccessibilityDelegateCompat() {
                    override fun onInitializeAccessibilityNodeInfo(
                        host: View,
                        info: AccessibilityNodeInfoCompat
                    ) {
                        info.isScreenReaderFocusable = value
                        super.onInitializeAccessibilityNodeInfo(host, info)
                    }
                })
        }
    }

    /**
     * When a new resource is available, this method tries to handle it.
     * It decides where provided bitmap should be displayed and clears the previous target/image.
     */
    open fun onResourceReady(
        target: ImageViewWrapperTarget,
        resource: Drawable,
        isPlaceholder: Boolean = false
    ) = true

    open fun rerenderIfNeeded(shouldRerenderBecauseOfResize: Boolean = false, force: Boolean = false) {

    }

    open fun onViewDestroys() {
        firstView.setImageDrawable(null)
        secondView.setImageDrawable(null)
    }

}
