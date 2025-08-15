package xrn.modules.kotlin

import xrn.modules.core.logging.LogHandlers
import xrn.modules.core.logging.Logger

internal val logger = Logger(listOf(LogHandlers.createOSLogHandler("XRNModulesCore")))
