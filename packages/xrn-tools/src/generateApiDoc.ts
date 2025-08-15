import { generateApiData } from "./generateApiData";
import { GenerateApiDataOptions } from "./types";
import { generateDocsStaticResources } from "./utils";
import { Package } from "./utils/PackageUtils";
import { SDKDoc } from "./utils/SDKDoc";

export const generateApiDoc = async (opts: GenerateApiDataOptions) => {
  const { packageName, sdk } = opts;
  const sdkVersion = sdk ? `v${sdk}.0.0` : `unversioned`;

  const sdkDoc = new SDKDoc(sdkVersion);
  const pkg = new Package(packageName);

  await generateApiData(opts);

  const xrnMeta = pkg.getXrnMeta();

  if (xrnMeta) {
    sdkDoc.writeDoc(xrnMeta);
  } else {
    console.warn(`${packageName} 没有 xrnMeta`);
  }

  generateDocsStaticResources();
};
