import { XRNBundle } from "@xrnjs/bundle";

export const bundleList = async () => {
  const list = await XRNBundle?.getBundleList?.();
  return list;
};
