import { capitalizeFirstLetter } from "../../utlis/charUtlis"
import { AppFormat, BuildEnv } from "../typing"


function isApkFormat(appFormat: AppFormat) {
    return appFormat === AppFormat.apk
}

function getAppParentFileName(channel: string, env: string, buildType: string, appFormat: AppFormat): string {
    const envFlavor = getFlavorEnvConfig(env)
    return isApkFormat(appFormat) ? `apk/${envFlavor}${capitalizeFirstLetter(channel)}/${buildType}` : `bundle/${envFlavor}${capitalizeFirstLetter(channel)}${capitalizeFirstLetter(buildType)}`
}

function getFlavorEnvConfig(buildEnv: string): "prod" | "dev" {
    return (buildEnv === BuildEnv.prod as string) ? "prod" : "dev"
}

function getBuildCommand(env: string, buildType: string, channel: string, appFormat: AppFormat): string {
    const envFlavor = getFlavorEnvConfig(env)
    return `./gradlew generateCodegenArtifactsFromSchema app:${isApkFormat(appFormat)? "assemble" : "bundle"}${envFlavor}${channel}${buildType}`
}

export { getAppParentFileName, getBuildCommand, getFlavorEnvConfig }