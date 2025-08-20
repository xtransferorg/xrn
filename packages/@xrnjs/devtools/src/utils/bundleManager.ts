import { XRNBundle } from "@xrnjs/bundle";

type BundleItem = {
  bundleName: string;
  port: string;
};

export const bundleList = async () => {
  const list = await XRNBundle?.getBundleList?.() as BundleItem[];
  return list;
};
