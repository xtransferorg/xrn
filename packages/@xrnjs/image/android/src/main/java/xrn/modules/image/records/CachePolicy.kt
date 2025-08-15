package xrn.modules.image.records

import xrn.modules.kotlin.types.Enumerable

enum class CachePolicy(val value: String) : Enumerable {
  NONE("none"),
  DISK("disk"),
  MEMORY("memory"),
  MEMORY_AND_DISK("memory-disk")
}
