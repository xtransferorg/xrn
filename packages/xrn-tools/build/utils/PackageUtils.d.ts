import { PackageJson, XrnMeta } from "./types";
export declare class Package {
    name: string;
    version: string;
    packageJsonPath: string;
    packageJson: PackageJson;
    constructor(name: string);
    getPackageJson(): PackageJson;
    writePackageJson(): void;
    getXrnMeta(): XrnMeta | undefined;
    updateFromScreen(screen: XrnMeta): void;
    installPackage(packageName: string): Promise<void>;
    installTo(targetPackageName: string): Promise<void>;
    installToXrnGo(): Promise<void>;
    installToXrnGoMain(): Promise<void>;
    installToXtRnCore(): Promise<void>;
    static fromPackageName(packageName: string): Package | null;
    static getPackages(): Package[];
    static getPackagesWithXrnMeta(): Package[];
    static getXrnMetaList(): XrnMeta[];
}
