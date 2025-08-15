import { Platform } from "../build/typing";

export const getCodePushKeyName = ({
  bundleName,
  platform,
  buildEnv = "dev",
  project,
}: {
  bundleName: string;
  platform: Platform;
  buildEnv?: string;
  project: string;
}) => {
  const codePushName = [project, bundleName, platform, buildEnv]
    .filter(Boolean)
    .join("-");
  return codePushName;
};
