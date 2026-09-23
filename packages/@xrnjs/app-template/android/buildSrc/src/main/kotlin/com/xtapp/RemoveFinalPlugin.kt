package com.xtapp

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.objectweb.asm.AnnotationVisitor
import org.objectweb.asm.ClassReader
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.ClassWriter
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes
import java.io.File
import java.util.zip.ZipFile

import com.android.build.api.instrumentation.AsmClassVisitorFactory
import com.android.build.api.instrumentation.ClassContext
import com.android.build.api.instrumentation.ClassData
import com.android.build.api.instrumentation.FramesComputationMode
import com.android.build.api.instrumentation.InstrumentationParameters
import com.android.build.api.instrumentation.InstrumentationScope
import com.android.build.api.variant.AndroidComponentsExtension

/**
 * Gradle Plugin: 去除 ReactModalHostView / ReactModalHostManager 的 final 修饰符
 *
 * 原因：RN 0.77.x 中这些类从 Java 改为 Kotlin 实现，Kotlin class 默认 final，
 * 导致 XTModalHostView / XTModalHostViewManager 无法继承。
 *
 * Part 1 - 编译期:
 *   在 Kotlin 编译 task 的 doFirst 阶段修改 classpath JAR，
 *   去除 ACC_FINAL + 剥离 @kotlin.Metadata 注解，
 *   使 Kotlin 编译器将这些类视为普通 Java 类，允许继承。
 *
 * Part 2 - 打包期:
 *   使用 AGP AsmClassVisitorFactory + InstrumentationScope.ALL，
 *   在 DEX 打包前修改所有依赖类的字节码，确保 APK 中的类也是 non-final。
 *
 * 使用方式：在 root build.gradle 中：
 *   project(':xrnjs_keyboard') { apply plugin: com.xtapp.RemoveFinalPlugin }
 */
class RemoveFinalPlugin : Plugin<Project> {

    companion object {
        /** 需要去除 final 的目标类前缀（匹配主类及所有内部类，如 $OnRequestCloseListener, $Companion 等） */
        val TARGET_CLASS_PREFIXES = listOf(
            "com/facebook/react/views/modal/ReactModalHostView",
            "com/facebook/react/views/modal/ReactModalHostManager"
        )

        /** 判断 JAR entry 是否属于目标类（主类或内部类） */
        fun isTargetClass(entryName: String): Boolean {
            if (!entryName.endsWith(".class")) return false
            val withoutExt = entryName.removeSuffix(".class")
            return TARGET_CLASS_PREFIXES.any { prefix ->
                withoutExt == prefix || withoutExt.startsWith("$prefix\$")
            }
        }

        /** 需要去除 final 的目标类（全限定类名格式，Part 2 使用） */
        val TARGET_CLASS_NAMES = setOf(
            "com.facebook.react.views.modal.ReactModalHostView",
            "com.facebook.react.views.modal.ReactModalHostManager"
        )
    }

    override fun apply(project: Project) {
        // ==================== Part 1: 编译期修改 ====================
        // 仅对非 application 模块注册（application 模块只需要 Part 2）
        // 由外围 build.gradle 控制哪些模块需要 apply 此插件
        project.afterEvaluate {
            if (!project.plugins.hasPlugin("com.android.application")) {
                project.tasks.configureEach {
                    if (name.startsWith("compile") && name.endsWith("Kotlin")) {
                        val taskRef = this
                        doFirst(object : org.gradle.api.Action<org.gradle.api.Task> {
                            override fun execute(t: org.gradle.api.Task) {
                                processClasspath(project, taskRef)
                            }
                        })
                    }
                }
            }
        }

        // ==================== Part 2: 打包期修改 ====================
        // 仅对 Android 模块注册 AsmClassVisitorFactory
        // 注意：需在 AGP variant 配置之前调用，否则 onVariants 会报 "too late"
        // 如果通过 subprojects {} 应用时已经太晚，try-catch 会优雅跳过
        // Part 2 仅对 application 模块注册（InstrumentationScope.ALL 不适用于 library 模块）
        project.plugins.withId("com.android.application") {
            try {
                registerInstrumentation(project)
            } catch (e: Exception) {
                project.logger.warn("RemoveFinalPlugin: Part2 skipped for :${project.name} (${e.message})")
            }
        }

        project.logger.lifecycle("RemoveFinalPlugin: applied to :${project.name}")
    }

    /**
     * Part 2: 注册 AGP Instrumentation，在 DEX 前修改字节码
     */
    private fun registerInstrumentation(project: Project) {
        val androidComponents = project.extensions.findByType(AndroidComponentsExtension::class.java)
        if (androidComponents == null) {
            project.logger.warn("RemoveFinalPlugin: AndroidComponentsExtension not found in :${project.name}")
            return
        }

        androidComponents.onVariants { variant ->
            variant.instrumentation.transformClassesWith(
                RemoveFinalClassVisitorFactory::class.java,
                InstrumentationScope.ALL
            ) {}
            variant.instrumentation.setAsmFramesComputationMode(
                FramesComputationMode.COPY_FRAMES
            )
            project.logger.lifecycle(
                "RemoveFinalPlugin: Part2 registered for variant '${variant.name}' in :${project.name}"
            )
        }
    }

    /**
     * 遍历 Kotlin 编译 task 的 classpath，找到 react-android JAR，
     * 提取目标类并修改后写入项目本地目录，然后将该目录 prepend 到 classpath。
     * 不修改原始 JAR，避免 FastJarHandler 读取重写后的 ZIP 导致 Internal compiler error。
     */
    private fun processClasspath(project: Project, task: org.gradle.api.Task) {
        project.logger.lifecycle("RemoveFinalPlugin: Part1 processClasspath for ${task.path}")

        // 通过反射获取 libraries 属性（Kotlin 2.0+ 的 ConfigurableFileCollection）
        var libraries: org.gradle.api.file.ConfigurableFileCollection? = null
        val classpathFiles = mutableSetOf<File>()
        try {
            val method = task.javaClass.methods.firstOrNull { it.name == "getLibraries" && it.parameterCount == 0 }
            if (method != null) {
                val result = method.invoke(task)
                if (result is org.gradle.api.file.ConfigurableFileCollection) {
                    libraries = result
                    classpathFiles.addAll(result.files)
                    project.logger.lifecycle("RemoveFinalPlugin: Found ${classpathFiles.size} files via getLibraries")
                }
            }
        } catch (e: Exception) {
            project.logger.warn("RemoveFinalPlugin: Reflection failed: ${e.message}")
        }

        if (libraries == null) {
            project.logger.warn("RemoveFinalPlugin: getLibraries not available, Part1 skipped for ${task.path}")
            return
        }

        val reactJars = classpathFiles.filter { it.isFile && it.extension == "jar" && it.name.contains("react-android") }
        project.logger.lifecycle("RemoveFinalPlugin: React JARs in classpath: ${reactJars.map { "${it.name}(exists=${it.exists()})" }}")

        // 提取目标类到项目本地目录
        val patchedClassesDir = File(project.buildDir, "removefinal-classes")
        var anyPatched = false
        reactJars.forEach { jarFile ->
            if (extractAndPatchClasses(project, jarFile, patchedClassesDir)) {
                anyPatched = true
            }
        }

        // 将 patched 目录 prepend 到 classpath，使编译器优先使用修改后的类
        if (anyPatched) {
            val existingFiles = libraries.files.toList()
            libraries.setFrom(listOf(patchedClassesDir) + existingFiles)
            project.logger.lifecycle("RemoveFinalPlugin: Prepended ${patchedClassesDir} to libraries (total ${existingFiles.size + 1} entries)")
        }
    }

    /**
     * 从 JAR 中提取目标类，修改后写入输出目录。
     * 使用 ZipFile 只读打开 JAR，不修改原始 JAR 文件。
     */
    private fun extractAndPatchClasses(project: Project, jarFile: File, outputDir: File): Boolean {
        try {
            val zipFile = ZipFile(jarFile)
            try {
                var anyExtracted = false
                // 枚举 JAR 中所有 entry，通过前缀匹配找到目标类及其所有内部类
                for (entry in zipFile.entries()) {
                    if (!isTargetClass(entry.name)) continue
                    val classBytes = zipFile.getInputStream(entry).use { it.readBytes() }
                    val outputFile = File(outputDir, entry.name)

                    // 检查输出目录是否已有正确的 patched 文件
                    if (outputFile.exists()) {
                        val existingBytes = outputFile.readBytes()
                        if (!classNeedsPatching(existingBytes)) {
                            project.logger.lifecycle("RemoveFinalPlugin: ${entry.name} already patched in output dir, skipping")
                            anyExtracted = true
                            continue
                        }
                    }

                    if (classNeedsPatching(classBytes)) {
                        project.logger.lifecycle("RemoveFinalPlugin: Part1 extracting and patching ${entry.name} from ${jarFile.name}")
                        val modifiedBytes = removeFinalFromClass(classBytes)
                        outputFile.parentFile.mkdirs()
                        outputFile.writeBytes(modifiedBytes)
                    } else {
                        project.logger.lifecycle("RemoveFinalPlugin: ${entry.name} already non-final in JAR, copying as-is")
                        outputFile.parentFile.mkdirs()
                        outputFile.writeBytes(classBytes)
                    }
                    anyExtracted = true
                }
                return anyExtracted
            } finally {
                zipFile.close()
            }
        } catch (e: Exception) {
            project.logger.error("RemoveFinalPlugin: Failed to extract from ${jarFile.path}: ${e.javaClass.simpleName}: ${e.message}")
            return false
        }
    }

    /** 检查单个 class 字节码：是否有 ACC_FINAL 或 @kotlin.Metadata */
    private fun classNeedsPatching(classBytes: ByteArray): Boolean {
        var hasFinal = false
        var hasMetadata = false
        val reader = ClassReader(classBytes)
        reader.accept(object : ClassVisitor(Opcodes.ASM9) {
            override fun visit(version: Int, access: Int, name: String?, signature: String?, superName: String?, interfaces: Array<out String>?) {
                if ((access and Opcodes.ACC_FINAL) != 0) hasFinal = true
            }
            override fun visitAnnotation(descriptor: String?, visible: Boolean): AnnotationVisitor? {
                if (descriptor == "Lkotlin/Metadata;") hasMetadata = true
                return null
            }
        }, ClassReader.SKIP_CODE or ClassReader.SKIP_DEBUG or ClassReader.SKIP_FRAMES)
        return hasFinal || hasMetadata
    }

    /**
     * Part 1 专用：使用 ASM 去除 ACC_FINAL 并剥离 @kotlin.Metadata
     */
    private fun removeFinalFromClass(classBytes: ByteArray): ByteArray {
        val reader = ClassReader(classBytes)
        val writer = ClassWriter(0)
        val visitor = CompileTimeRemoveFinalVisitor(writer)
        reader.accept(visitor, 0)
        return writer.toByteArray()
    }
}

// ========================= Part 1: 编译期 ClassVisitor =========================

/**
 * 编译期 ASM ClassVisitor：
 * 1. 去除 class 和 method 上的 ACC_FINAL 标志
 * 2. 完全剥离 @kotlin.Metadata 注解，使 Kotlin 编译器将此类视为普通 Java 类
 */
class CompileTimeRemoveFinalVisitor(cv: ClassVisitor) : ClassVisitor(Opcodes.ASM9, cv) {

    private var className: String? = null

    override fun visit(
        version: Int,
        access: Int,
        name: String?,
        signature: String?,
        superName: String?,
        interfaces: Array<out String>?
    ) {
        className = name
        val newAccess = access and Opcodes.ACC_FINAL.inv()
        super.visit(version, newAccess, name, signature, superName, interfaces)
    }

    override fun visitAnnotation(descriptor: String?, visible: Boolean): AnnotationVisitor? {
        if (descriptor == "Lkotlin/Metadata;") {
            // 完全剥离 @kotlin.Metadata 注解 —— 让 Kotlin 编译器将此类视为普通 Java 类
            println("RemoveFinalPlugin: stripping @kotlin.Metadata from $className")
            return object : AnnotationVisitor(Opcodes.ASM9) {
                override fun visit(name: String?, value: Any?) {}
                override fun visitArray(name: String?): AnnotationVisitor {
                    return object : AnnotationVisitor(Opcodes.ASM9) {
                        override fun visit(name: String?, value: Any?) {}
                    }
                }
            }
        }
        return super.visitAnnotation(descriptor, visible)
    }

    override fun visitMethod(
        access: Int,
        name: String?,
        descriptor: String?,
        signature: String?,
        exceptions: Array<out String>?
    ): MethodVisitor? {
        var newAccess = access
        val isPrivate = (access and Opcodes.ACC_PRIVATE) != 0
        val isStatic = (access and Opcodes.ACC_STATIC) != 0
        val isConstructor = name == "<init>" || name == "<clinit>"

        if (!isPrivate && !isStatic && !isConstructor) {
            newAccess = access and Opcodes.ACC_FINAL.inv()
        }
        return super.visitMethod(newAccess, name, descriptor, signature, exceptions)
    }
}

// ========================= Part 2: 打包期 AsmClassVisitorFactory =========================

/**
 * AGP AsmClassVisitorFactory：在 DEX 打包前处理类字节码
 * 仅去除 ACC_FINAL（不需要移除 @kotlin.Metadata，运行时 Metadata 可保留）
 */
abstract class RemoveFinalClassVisitorFactory :
    AsmClassVisitorFactory<InstrumentationParameters.None> {

    override fun createClassVisitor(
        classContext: ClassContext,
        nextClassVisitor: ClassVisitor
    ): ClassVisitor {
        return PackageTimeRemoveFinalVisitor(nextClassVisitor)
    }

    override fun isInstrumentable(classData: ClassData): Boolean {
        val name = classData.className.replace('.', '/')
        return RemoveFinalPlugin.isTargetClass("$name.class")
    }
}

/**
 * 打包期 ASM ClassVisitor：仅去除 ACC_FINAL，保留 @kotlin.Metadata
 */
class PackageTimeRemoveFinalVisitor(cv: ClassVisitor) : ClassVisitor(Opcodes.ASM9, cv) {

    override fun visit(
        version: Int,
        access: Int,
        name: String?,
        signature: String?,
        superName: String?,
        interfaces: Array<out String>?
    ) {
        val newAccess = access and Opcodes.ACC_FINAL.inv()
        super.visit(version, newAccess, name, signature, superName, interfaces)
    }

    override fun visitMethod(
        access: Int,
        name: String?,
        descriptor: String?,
        signature: String?,
        exceptions: Array<out String>?
    ): MethodVisitor? {
        var newAccess = access
        val isPrivate = (access and Opcodes.ACC_PRIVATE) != 0
        val isStatic = (access and Opcodes.ACC_STATIC) != 0
        val isConstructor = name == "<init>" || name == "<clinit>"

        if (!isPrivate && !isStatic && !isConstructor) {
            newAccess = access and Opcodes.ACC_FINAL.inv()
        }
        return super.visitMethod(newAccess, name, descriptor, signature, exceptions)
    }
}
