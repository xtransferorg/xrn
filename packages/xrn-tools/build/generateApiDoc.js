"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiDoc = void 0;
const generateApiData_1 = require("./generateApiData");
const utils_1 = require("./utils");
const PackageUtils_1 = require("./utils/PackageUtils");
const SDKDoc_1 = require("./utils/SDKDoc");
const generateApiDoc = async (opts) => {
    const { packageName, sdk } = opts;
    const sdkVersion = sdk ? `v${sdk}.0.0` : `unversioned`;
    const sdkDoc = new SDKDoc_1.SDKDoc(sdkVersion);
    const pkg = new PackageUtils_1.Package(packageName);
    await (0, generateApiData_1.generateApiData)(opts);
    const xrnMeta = pkg.getXrnMeta();
    if (xrnMeta) {
        sdkDoc.writeDoc(xrnMeta);
    }
    else {
        console.warn(`${packageName} 没有 xrnMeta`);
    }
    (0, utils_1.generateDocsStaticResources)();
};
exports.generateApiDoc = generateApiDoc;
//# sourceMappingURL=generateApiDoc.js.map