import ora from "ora";
import { execAsync } from "./shell";

export async function sendDingTalkMessage(
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): Promise<void> {
  const spinner = ora();
  try {
    spinner.start(`发送消息到钉钉...`);
    await execAsync(
      `curl "https://oapi.dingtalk.com/robot/send?access_token=${token}" \
        -H 'Content-Type: application/json' \
        -d '${JSON.stringify(payload)}'`
    );
    spinner.succeed("钉钉消息发送成功");
  } catch (error) {
    spinner.fail("发送钉钉消息失败");
    throw error;
  }
}

export async function notifyDD(
  token: string,
  params: { link: string; message: string }
): Promise<void> {
  const { message, link } = params;
  ora().info(`上传链接: ${link}`);
  const payload = {
    msgtype: "markdown",
    markdown: {
      title: "App打包构建成功",
      text: message,
    },
  };
  await sendDingTalkMessage(token, payload);
}