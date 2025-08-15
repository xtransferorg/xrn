import { Package } from "./PackageUtils";
import { XrnMeta } from "./types";
export declare class Screen {
    xrnMeta: XrnMeta;
    constructor(xrnMeta: XrnMeta);
    getScreenPath(): string;
    getScreenFileContent(): string;
    genScreenFileContent(): Promise<string>;
    writeScreenFile(): Promise<void>;
}
export declare class ScreenList {
    screens: Screen[];
    constructor(screens: Screen[]);
    static create(): ScreenList;
    getScreensDirPath(): string;
    getScreensJsonPath(): string;
    getNavigationScreensPath(): string;
    static loadFromJson(): Screen[];
    addPackageToScreenJson(pkg: Package): Promise<void>;
    generateNavigationScreens(): Promise<void>;
    generateScreenFiles(): Promise<void>;
}
