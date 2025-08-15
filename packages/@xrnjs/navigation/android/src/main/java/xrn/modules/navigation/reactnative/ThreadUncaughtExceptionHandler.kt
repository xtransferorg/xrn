package xrn.modules.navigation.reactnative

internal class ThreadUncaughtExceptionHandler(val onUncaught: () -> Unit) :
    Thread.UncaughtExceptionHandler {

    private val defaultUncaughtExceptionHandler = Thread.getDefaultUncaughtExceptionHandler()

    override fun uncaughtException(t: Thread, e: Throwable) {
        try {
            onUncaught()
        } catch (_: Exception) {

        } finally {
            defaultUncaughtExceptionHandler?.uncaughtException(t, e)
        }
    }

}