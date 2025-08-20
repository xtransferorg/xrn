import { generateApiDoc } from "./generateApiDoc";
import { ScreenList } from "./utils/Screen";
import { SdKVersion } from "./utils/types";

export async function generateScreensApiDoc(sdk?: SdKVersion) {
  try {
    const screens = ScreenList.loadFromJson();

    for (const screen of screens) {
      if (!screen.xrnMeta.packageName) {
        console.warn(
          `screen ${screen.xrnMeta.showName} 没有 packageName，跳过`
        );
        continue;
      }

      console.log(`正在为 ${screen.xrnMeta.packageName} 生成 API 文档...`);
      await generateApiDoc({
        packageName: screen.xrnMeta.packageName,
        sdk,
        entryPoint: screen.xrnMeta.entryPoint,
      });
    }

    console.log("所有包的 API 文档生成完成");
  } catch (error) {
    console.error("生成 API 文档时出错:", error);
    process.exit(1);
  }
}
