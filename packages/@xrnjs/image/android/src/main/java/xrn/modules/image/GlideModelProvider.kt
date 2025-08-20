package xrn.modules.image

import android.graphics.drawable.Drawable
import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl
import xrn.modules.image.blurhash.BlurhashModel
import xrn.modules.image.decodedsource.DecodedModel
import xrn.modules.image.okhttp.GlideUrlWrapper
import xrn.modules.image.thumbhash.ThumbhashModel

fun interface GlideModelProvider {
  fun getGlideModel(): Any
}

data class DecodedModelProvider(
  private val drawable: Drawable
) : GlideModelProvider {
  override fun getGlideModel() = DecodedModel(drawable)
}

data class UrlModelProvider(
  private val glideUrl: GlideUrl
) : GlideModelProvider {
  override fun getGlideModel() = GlideUrlWrapper(glideUrl)
}

data class RawModelProvider(
  private val data: String
) : GlideModelProvider {
  override fun getGlideModel() = data
}

data class UriModelProvider(
  private val uri: Uri
) : GlideModelProvider {
  override fun getGlideModel() = uri
}

data class BlurhashModelProvider(
  private val uri: Uri,
  private val width: Int,
  private val height: Int
) : GlideModelProvider {
  override fun getGlideModel() = BlurhashModel(uri, width, height)
}

data class ThumbhashModelProvider(
  private val uri: Uri
) : GlideModelProvider {
  override fun getGlideModel() = ThumbhashModel(uri)
}
