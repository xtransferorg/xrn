import { BuildEnv, Platform } from "../build/typing";



export interface CodePushParams {
    privateKey?: string,
    app: string,
    projectName: string,
    branch: string,
    isIncrement: boolean,
    platform: Platform;
    desc: string;
    env: BuildEnv;
    appVersion: string;
    isMandatory: string
    uuid?: string
    whiteList?: string
    channelReleaseId?: string
    rollout?: string
    skipCheckXtRnCoreVersion?: boolean
    isDev?: boolean
    versionParts?: string[]
}

export interface CodePushDeployment {
    createdTime: number;
    id:          string;
    key:         string;
    name:        string;
    package:     CodePushPackage | null;
}

export interface CodePushPackage {
    description:        string;
    isDisabled:         boolean;
    isMandatory:        boolean;
    rollout:            number;
    appVersion:         string;
    packageHash:        string;
    blobUrl:            string;
    size:               number;
    manifestBlobUrl:    string;
    diffPackageMap:     { [key: string]: CodePushDiffPackageMap };
    releaseMethod:      string;
    uploadTime:         number;
    originalLabel:      string;
    originalDeployment: string;
    label:              string;
    releasedBy:         string;
    metrics:            CodePushMetrics;
}

export interface CodePushDiffPackageMap {
    size: number;
    url:  string;
}

export interface CodePushMetrics {
    active:      number;
    downloaded:  number;
    failed:      number;
    installed:   number;
    totalActive: number;
}
