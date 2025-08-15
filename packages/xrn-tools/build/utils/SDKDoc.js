"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDKDoc = void 0;
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
const Screen_1 = require("./Screen");
class SDKDoc {
    sdkVersion;
    docPath;
    constructor(sdkVersion) {
        this.sdkVersion = sdkVersion;
        this.docPath = path_1.default.join(Constants_1.XRN_DIR, "docs", "pages", "versions", `${this.sdkVersion}`, "sdk");
    }
    async writeDoc(xrnMeta) {
        if (!xrnMeta.sdkPath) {
            console.warn(`${xrnMeta.showName} 没有 sdkPath，跳过`);
            return;
        }
        const docPath = path_1.default.join(this.docPath, `${xrnMeta.sdkPath}.mdx`);
        const meta = xrnMeta;
        const screen = new Screen_1.Screen(meta);
        const templatePath = path_1.default.join(Constants_1.TOOLS_TEMPLATES_DIR, "sdk-doc.ejs");
        const template = await fs_extra_1.default.readFile(templatePath, "utf-8");
        const screenContent = screen.getScreenFileContent();
        const content = ejs_1.default.render(template, { meta, screenContent });
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(docPath));
        fs_extra_1.default.writeFileSync(docPath, content);
    }
}
exports.SDKDoc = SDKDoc;
//# sourceMappingURL=SDKDoc.js.map