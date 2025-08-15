import { buildJobContext as globalBuildJobContext } from "../BuildJobContext";
import { BundlePreparer } from "./bundlePrepare";

export async function prepareBundle() {
  const preparer = new BundlePreparer(globalBuildJobContext);
  return preparer.run();
}
