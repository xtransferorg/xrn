package xrn.modules.multibundle.bundle.split

object RuntimeChecker {

    fun usedMem(thresholdPercent: Double): Boolean {
        val runtime = Runtime.getRuntime()
        val usedMem = runtime.totalMemory() - runtime.freeMemory()
        val maxMem = runtime.maxMemory()
        val usedMemPercent = usedMem.toDouble() / maxMem.toDouble()
        return usedMemPercent > thresholdPercent
    }

    fun freeMemLessThan(threshold: Int): Boolean {
        val runtime = Runtime.getRuntime()
        val usedMem = runtime.totalMemory() - runtime.freeMemory()
        val maxMem = runtime.maxMemory()
        return (maxMem - usedMem) < threshold
    }

}