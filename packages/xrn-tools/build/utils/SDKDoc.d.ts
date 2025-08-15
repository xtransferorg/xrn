import { XrnMeta } from "./types";
export declare class SDKDoc {
    sdkVersion: string;
    docPath: string;
    constructor(sdkVersion: string);
    writeDoc(xrnMeta: XrnMeta): Promise<void>;
}
