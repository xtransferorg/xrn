import { DocNavigation, NavSDK } from "../docConstants";
export declare const execAsync: (command: any, opts?: {
    stdio: "inherit" | null;
}) => Promise<{
    stdout: string;
    stderr: string;
}>;
export declare const generateDocsStaticResources: () => void;
interface PackageInfo {
    location: string;
    name: string;
}
export declare const getWorkspacePackages: () => Promise<PackageInfo[]>;
export declare const findWorkspacePackage: (packageName: string) => Promise<PackageInfo | undefined>;
export declare const getPackageJsonByName: (packageName: string) => Promise<{
    name: string;
    version: string;
} | null>;
export declare const choosePackage: () => Promise<PackageInfo>;
export declare const readDocConstantsFile: (filename: string) => DocNavigation;
export declare const createNewNavigation: () => Promise<NavSDK>;
export declare const chooseApiType: () => Promise<string>;
export declare function sendDingTalkNotification(message: string): Promise<void>;
export {};
