package xrn.modules.image.records

import com.bumptech.glide.request.target.Target.SIZE_ORIGINAL
import xrn.modules.kotlin.records.Field
import xrn.modules.kotlin.records.Record

data class ImageLoadOptions(
  @Field
  val maxWidth: Int = SIZE_ORIGINAL,
  @Field
  val maxHeight: Int = SIZE_ORIGINAL
) : Record
