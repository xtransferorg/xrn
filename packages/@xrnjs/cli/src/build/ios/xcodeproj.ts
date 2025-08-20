import { execShellCommand } from "../utils/shell";
import { buildJobContext } from "../BuildJobContext";
import path from 'path'

export enum XcodeConfigMode {
    Debug = "Debug",
    Release = "Release",
    Staging = "Staging"
}

export async function xcodeprojChange(mode: XcodeConfigMode, key: string, value: string) {

    
    //     # project_path = '/Users/liyuan/Documents/repo/xt-app-ios/ios/xtapp.xcodeproj'
    // project_path = ARGV[0] # 工程路径
    // project_target = ARGV[1] # 是壳工程的target
    // # Debug
    // # Release
    // # Staging
    // project_config_name = ARGV[2] # 是壳工程的模式
    // project_buildSettings_key = ARGV[3] # 需要修改的 buildSettings 的key
    // project_buildSettings_value = ARGV[4] # 需要修改的 buildSettings 的value
    const ARGV0 = `${process.cwd()}/ios/${buildJobContext.nativeProjectName}.xcodeproj`
    const ARGV1 = buildJobContext.nativeProjectName
    const ARGV2 = mode
    const ARGV3 = key
    const ARGV4 = value

    process.env.xt_xcodeproj_v0 = ARGV0
    process.env.xt_xcodeproj_v1 = ARGV1
    process.env.xt_xcodeproj_v2 = ARGV2
    process.env.xt_xcodeproj_v3 = ARGV3
    process.env.xt_xcodeproj_v4 = ARGV4

    const script_root = path.resolve(__dirname, '../../../');
    await execShellCommand(`ruby ${script_root}/files/xt_xcodeproj_helper.rb $xt_xcodeproj_v0 $xt_xcodeproj_v1 $xt_xcodeproj_v2 $xt_xcodeproj_v3 $xt_xcodeproj_v4`)
}
