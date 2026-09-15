import { getSimpleSignatures } from "../build/utils/generateSignatures";
import { SchemaType } from "@react-native/codegen/lib/CodegenSchema";
import { BuildEnv, BuildType, Platform } from "../build/typing";
import logger from "../utlis/logger";
import fs from "fs-extra";
import path from "path";
import { BaselineManagerFactory } from "../build/BaselineManagerFactory";
import { BaseLineFileType } from "../build/BaselineManager";

// 定义简化签名的类型
type SimpleSignatures = {
  components: string[];
  modules: Record<string, string[]>;
};

// 比较两个签名，返回新增的签名
export function getNewSignatures(
  targetSignatures: SimpleSignatures,
  latestSignatures: SimpleSignatures
): SimpleSignatures {
  const newSignatures: SimpleSignatures = {
    components: [],
    modules: {},
  };

  // 比较组件签名
  const targetComponentsSet = new Set(targetSignatures.components || []);
  latestSignatures.components?.forEach((component) => {
    if (!targetComponentsSet.has(component)) {
      newSignatures.components.push(component);
    }
  });

  // 比较模块签名
  const targetModules = targetSignatures.modules || {};
  const latestModules = latestSignatures.modules || {};

  // 遍历最新版本的模块
  Object.keys(latestModules).forEach((moduleName) => {
    const latestMethods = latestModules[moduleName] || [];
    const targetMethods = targetModules[moduleName] || [];
    const targetMethodsSet = new Set(targetMethods);

    // 找出新增的方法
    const newMethods = latestMethods.filter(
      (method) => !targetMethodsSet.has(method)
    );

    if (newMethods.length > 0) {
      newSignatures.modules[moduleName] = newMethods;
    }
  });

  return newSignatures;
}

export async function injectNativeSignature({
  platform,
  environment,
  latestVersion,
}: {
  platform: Platform;
  environment: BuildEnv;
  latestVersion?: string;
}) {
  // 获取最新版本的签名
  const latestBaselineManager = BaselineManagerFactory.createOrGet({
    platform,
    buildEnv: environment,
    buildType: BuildType.RELEASE,
    version: latestVersion,
  });
  await latestBaselineManager.downloadFiles({
    file_types: [BaseLineFileType.NATIVE_SIGNATURE],
  });
  const { signature: latestSignature } = latestBaselineManager.baseRepoManage();

  if (!fs.existsSync(latestSignature.get())) {
    logger.warn(`${latestSignature.get()} 文件不存在，请检查文件是否存在`);
    return;
  }

  const latestSignatureSchemaJson = await fs.readFile(
    latestSignature.get(),
    "utf-8"
  );
  const latestSignatureSchema = JSON.parse(
    latestSignatureSchemaJson
  ) as SchemaType;
  const latestSimpleSignatures = getSimpleSignatures(latestSignatureSchema);

  const projectRootPath = process.cwd();

  const templateNativeSignaturePath = path.resolve(
    projectRootPath,
    `node_modules/@xrnjs/core/templates/native-capability-signature.json`
  );

  fs.ensureFileSync(templateNativeSignaturePath);
  await fs.writeFile(
    templateNativeSignaturePath,
    JSON.stringify(latestSimpleSignatures, null, 2),
    "utf-8"
  );

  logger.info(
    `注入原生方法签名成功，签名文件路径: ${templateNativeSignaturePath}`
  );
}
