import { capitalizeFirstLetter } from "../../utlis/charUtlis"
import { AppFormat, BuildEnv } from "../typing"


function isApkFormat(appFormat: AppFormat) {
    return appFormat === AppFormat.apk
}

function getAppParentFileName(channel: string, env: string, buildType: string, appFormat: AppFormat): string {
    const envFlavor = getFlavorEnvConfig(env)
    // return isApkFormat(appFormat) ? `apk/${envFlavor}${capitalizeFirstLetter(channel)}/${buildType}` : `bundle/${envFlavor}${capitalizeFirstLetter(channel)}${capitalizeFirstLetter(buildType)}`
    return isApkFormat(appFormat) ? `apk/${buildType}` : `bundle/${capitalizeFirstLetter(buildType)}`
}

function getFlavorEnvConfig(buildEnv: string): "prod" | "dev" | "" {
    // return (buildEnv === BuildEnv.prod as string) ? "prod" : "dev"
    return ""
}

function getBuildCommand(env: string, buildType: string, channel: string, appFormat: AppFormat): string {
    // const envFlavor = getFlavorEnvConfig(env)
    // return `./gradlew app:${isApkFormat(appFormat)? "assemble" : "bundle"}${envFlavor}${channel}${buildType}`
    return `./gradlew app:${isApkFormat(appFormat)? "assemble" : "bundle"}${buildType}`
}

export { getAppParentFileName, getBuildCommand, getFlavorEnvConfig }

