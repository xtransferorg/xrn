package xrn.modules.multibundle.bundle

/**
 * bundle state
 */
enum class BundleState {
    /**
     * RNInstance not created.
     */
    UNKNOWN,
    /**
     * RNInstance object created.
     */
    INIT,
    /**
     * runJSBundle has completed.
     */
    JS_READY,
    /**
     * Reloading in progress.
     */
    RELOADING,
    /**
     * Destroyed.
     */
    DESTROY,
    /**
     * runJSBundle encountered an error.
     */
    RUN_JS_ERROR
}

/**
 * Wrapper class to hold and manage the state of a bundle.
 *
 * @property bundleName The unique name of the bundle.
 * @property bundleState The current state of the bundle. Defaults to UNKNOWN.
 */
class BundleStateWrapper(val bundleName: String, bundleState: BundleState = BundleState.UNKNOWN) {

    /**
     * Current state of the bundle.
     */
    private var bundleState: BundleState = bundleState

    /**
     * Flag indicating if this is the first time the bundle is loaded.
     */
    private var isFirstLoad = true

    /**
     * Flag indicating whether the bundle has been fully loaded.
     */
    private var isBundleLoaded = false

    /**
     * Gets the current bundle state.
     */
    fun getBundleState(): BundleState {
        return bundleState
    }

    /**
     * Sets the bundle state.
     */
    fun setBundleState(state: BundleState) {
        this.bundleState = state
    }

    /**
     * Returns whether the bundle has been loaded.
     */
    fun isBundleLoaded(): Boolean {
        return this.isBundleLoaded
    }

    /**
     * Sets the loaded status of the bundle.
     */
    fun setBundleLoaded(loaded: Boolean) {
        this.isBundleLoaded = loaded
    }

    /**
     * Returns whether this is the first load of the bundle.
     */
    fun getIsFirstLoad(): Boolean {
        return isFirstLoad;
    }

    /**
     * Sets the flag indicating if this is the first load.
     */
    fun setFirstLoad(firstLoad: Boolean) {
        this.isFirstLoad = firstLoad;
    }
}