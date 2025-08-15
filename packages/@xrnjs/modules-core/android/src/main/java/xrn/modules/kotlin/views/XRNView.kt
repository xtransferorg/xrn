package xrn.modules.kotlin.views

import android.content.Context
import android.widget.LinearLayout
import xrn.modules.kotlin.AppContext

/**
 * A base class that should be used by every exported views.
 */
abstract class XRNView(
  context: Context,
  val appContext: AppContext
) : LinearLayout(context)
