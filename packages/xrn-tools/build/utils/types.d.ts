import React from 'react';
export interface XrnMeta {
    name: string;
    title?: string;
    showName?: string;
    description?: string;
    group?: string;
    packageName?: string;
    sdkPath?: string;
    exportFromCore?: boolean;
    entryPoint?: string;
}
export type ScreenConfig = {
    getComponent(): React.ComponentType<object> | (() => JSX.Element);
    name: string;
    showName?: string;
    description?: string;
    group?: string;
    route?: string;
    options?: object;
    packageName?: string;
    sdkPath?: string;
    onClick?: () => void;
};
export interface PackageJson {
    name: string;
    version: string;
    private?: boolean;
    description?: string;
    homepage?: string;
    xrnMeta?: XrnMeta;
}
export type SdKVersion = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
