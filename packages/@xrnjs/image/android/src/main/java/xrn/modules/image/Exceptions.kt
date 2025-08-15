package xrn.modules.image

import xrn.modules.kotlin.exception.CodedException

class ImageLoadFailed(exception: Exception) :
  CodedException(message = "Failed to load the image: ${exception.message}")
