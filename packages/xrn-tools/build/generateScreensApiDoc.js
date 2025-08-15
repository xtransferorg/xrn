"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateScreensApiDoc = generateScreensApiDoc;
const generateApiDoc_1 = require("./generateApiDoc");
const Screen_1 = require("./utils/Screen");
async function generateScreensApiDoc(sdk) {
    try {
        const screens = Screen_1.ScreenList.loadFromJson();
        for (const screen of screens) {
            if (!screen.xrnMeta.packageName) {
                console.warn(`screen ${screen.xrnMeta.showName} 没有 packageName，跳过`);
                continue;
            }
            console.log(`正在为 ${screen.xrnMeta.packageName} 生成 API 文档...`);
            await (0, generateApiDoc_1.generateApiDoc)({
                packageName: screen.xrnMeta.packageName,
                sdk,
                entryPoint: screen.xrnMeta.entryPoint,
            });
        }
        console.log("所有包的 API 文档生成完成");
    }
    catch (error) {
        console.error("生成 API 文档时出错:", error);
        process.exit(1);
    }
}
//# sourceMappingURL=generateScreensApiDoc.js.map