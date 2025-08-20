import { execShellCommand } from "../build/utils/shell";

interface Config {
  channelReleaseId: string;
  rollout: string;
  whiteList?: string;
}

export async function grayRelease(config: Config) {
  const { channelReleaseId, rollout, whiteList } = config;

  let whiteListOption = "";
  if (whiteList) {
    whiteListOption = `--whiteList "${whiteList}"`;
  }

  await execShellCommand(
    `code-push batch patch --channelReleaseId "${channelReleaseId}" --rollout "${rollout}" ${whiteListOption}`,
    {
      cwd: process.cwd(),
    }
  );
}
