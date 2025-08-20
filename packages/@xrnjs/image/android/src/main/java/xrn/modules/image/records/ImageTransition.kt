package xrn.modules.image.records

import xrn.modules.kotlin.records.Field
import xrn.modules.kotlin.records.Record

data class ImageTransition(
  @Field val duration: Int = 0
) : Record
