package xrn.modules.image.enums

import com.bumptech.glide.load.DataSource

enum class ImageCacheType(private vararg val dataSources: DataSource) {
  NONE(DataSource.LOCAL, DataSource.REMOTE),
  DISK(DataSource.DATA_DISK_CACHE, DataSource.RESOURCE_DISK_CACHE),
  MEMORY(DataSource.MEMORY_CACHE);

  companion object {
    fun fromNativeValue(value: DataSource): ImageCacheType = when (value) {
      DataSource.LOCAL, DataSource.REMOTE -> NONE
      DataSource.DATA_DISK_CACHE, DataSource.RESOURCE_DISK_CACHE -> DISK
      DataSource.MEMORY_CACHE -> MEMORY
      else -> throw IllegalArgumentException("Unknown data source: $value")
    }
  }
}
