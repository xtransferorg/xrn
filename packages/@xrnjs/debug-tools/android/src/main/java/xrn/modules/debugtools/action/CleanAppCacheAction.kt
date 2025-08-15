package xrn.modules.debugtools.action

import android.content.Context
import java.io.File

class CleanAppCacheAction(val context: Context): IAction {

    override fun name(): String {
        return "清理缓存"
    }

    override fun doAction() {
        try {
            val cacheDir = context.cacheDir
            deleteDir(cacheDir)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // 递归删除目录及其内容
    private fun deleteDir(dir: File?): Boolean {
        if (dir != null && dir.isDirectory) {
            val children = dir.listFiles()
            if (children != null) {
                for (child in children) {
                    deleteDir(child)
                }
            }
        }
        return dir?.delete() ?: false
    }
}