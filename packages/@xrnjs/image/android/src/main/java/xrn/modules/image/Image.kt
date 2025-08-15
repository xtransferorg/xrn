package xrn.modules.image

import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable

class Image(ref: Drawable) /* : SharedRef<Drawable>(ref)*/ {
  /*override val nativeRefType: String = "image"

  override fun getAdditionalMemoryPressure(): Int {
    val ref = ref
    if (ref is BitmapDrawable) {
      return ref.getBitmap().allocationByteCount
    }

    // We can't get the size in bytes of the drawable.
    // Let's just return the size in pixels for now.
    return ref.intrinsicWidth * ref.intrinsicHeight
  }*/
}
