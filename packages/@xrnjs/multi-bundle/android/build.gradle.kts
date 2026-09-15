buildscript {
    val kotlinVersion: String = rootProject.extra["kotlin_version"] as String
//    val kotlinVersion: String = if (rootProject.extra.has("kotlin_version")) {
//        rootProject.extra["kotlin_version"] as String
//    } else {
//        project.properties["FaceidModule_kotlinVersion"] as? String
//            ?: throw GradleException("Missing 'kotlinVersion' in rootProject.ext or project.properties")
//    }

    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath("com.android.tools.build:gradle:7.2.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
//    id("com.facebook.react")
}

android {
    namespace = "xrn.modules.multibundle"
    compileSdk = 34

    defaultConfig {
//        applicationId = "com.xrn.multibundle"
        minSdk = 21
        targetSdk = 34

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true

    }
}

var enableHermes = project.findProperty("enableHermes") as? Boolean ?: false
val jscFlavor = "org.webkit:android-jsc-intl:+"

dependencies {

//    implementation("androidx.core:core-ktx:1.15.0")
//    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("com.blankj:utilcodex:1.31.1")

    implementation("org.jetbrains.kotlin:kotlin-reflect:1.8.20")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    implementation("com.facebook.react:react-native:+")
}
