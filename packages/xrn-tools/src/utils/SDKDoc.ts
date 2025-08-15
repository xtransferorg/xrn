import ejs from "ejs";
import fsExtra from "fs-extra";
import path from "path";

import { XRN_DIR, TOOLS_TEMPLATES_DIR } from "../Constants";
import { Screen } from "./Screen";
import { XrnMeta } from "./types";

export class SDKDoc {
  sdkVersion: string;
  docPath: string;

  constructor(sdkVersion: string) {
    this.sdkVersion = sdkVersion;
    this.docPath = path.join(
      XRN_DIR,
      "docs",
      "pages",
      "versions",
      `${this.sdkVersion}`,
      "sdk"
    );
  }

  async writeDoc(xrnMeta: XrnMeta) {
    if (!xrnMeta.sdkPath) {
      console.warn(`${xrnMeta.showName} 没有 sdkPath，跳过`);
      return;
    }
    const docPath = path.join(this.docPath, `${xrnMeta.sdkPath}.mdx`);
    const meta = xrnMeta;
    const screen = new Screen(meta);

    const templatePath = path.join(TOOLS_TEMPLATES_DIR, "sdk-doc.ejs");
    const template = await fsExtra.readFile(templatePath, "utf-8");
    const screenContent = screen.getScreenFileContent();
    const content = ejs.render(template, { meta, screenContent });

    fsExtra.ensureDirSync(path.dirname(docPath));
    fsExtra.writeFileSync(docPath, content);
  }
}
