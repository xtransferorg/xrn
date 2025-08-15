package xrn.modules.multibundle.bundle.core

import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener
import xrn.modules.multibundle.bundle.RNHostManager

/**
 * Listener to monitor the React Native bridge idle state for a specific bundle.
 *
 * @param bundleName The name of the bundle this listener is associated with.
 */
class BridgeIdleDebugListener(private val bundleName: String): NotThreadSafeBridgeIdleDebugListener {
    override fun onTransitionToBridgeIdle() {
    }

    override fun onTransitionToBridgeBusy() {
    }

    /**
     * Called when the bridge is destroyed.
     * Marks the bundle as not loaded in the RNHostManager.
     */
    override fun onBridgeDestroyed() {
        RNHostManager.getBundleStateWrapper(bundleName)?.setBundleLoaded(false)
    }
}