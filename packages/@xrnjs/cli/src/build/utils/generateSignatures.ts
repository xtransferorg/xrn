import { SchemaType } from "@react-native/codegen/lib/CodegenSchema";
import { Platform } from "../typing";
import * as combineJsToSchema from "@react-native/codegen/lib/cli/combine/combine-js-to-schema.js";
import { filterNativeDeps, loadReactNativeConfigDeps } from "./package";
import path from "path";
import fs from "fs";

export const getSignatureSchema = async (
  platform: Platform
): Promise<SchemaType> => {
  const nativeDeps = filterNativeDeps(
    await loadReactNativeConfigDeps(process.cwd()),
    platform
  );

  const specFilePaths: string[] = [];

  const SUPPORTED_SPEC_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

  const collectSupportedFiles = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        collectSupportedFiles(fullPath);
        continue;
      }
      const ext = path.extname(entry.name).replace(/^\./, "");
      if (SUPPORTED_SPEC_EXTENSIONS.includes(ext)) {
        specFilePaths.push(fullPath);
      }
    }
  };

  for (const depName of Object.keys(nativeDeps)) {
    if (!depName.startsWith("xrn-")) {
      continue;
    }
    const depInfo = nativeDeps[depName];
    if (depInfo && depInfo.root) {
      const srcDir = path.join(depInfo.root, "src");
      collectSupportedFiles(srcDir);
    }
  }

  const uberSchema = combineJsToSchema.combineSchemasInFileList(
    specFilePaths,
    platform,
    undefined
  );

  return uberSchema;
};

export const getSimpleSignatures = (schema: SchemaType) => {
  // 构建简化版签名
  type SimpleSignatures = {
    components: string[];
    modules: Record<string, string[]>;
  };

  const componentsSet = new Set<string>();
  const modulesMap: Record<string, string[]> = {};

  Object.values(schema.modules).forEach((moduleSchema) => {
    // Component 类型：收集组件名
    if ((moduleSchema as any).type === "Component") {
      const componentSchema = moduleSchema as any;
      const componentsMap = componentSchema.components as Record<
        string,
        unknown
      >;
      Object.keys(componentsMap).forEach((componentName) =>
        componentsSet.add(componentName)
      );
      return;
    }

    // NativeModule 类型：收集方法名
    if ((moduleSchema as any).type === "NativeModule") {
      const nativeModule = moduleSchema as any;
      const moduleName: string = nativeModule.moduleName;
      const methods: readonly any[] = nativeModule.spec?.methods ?? [];
      const methodNames: string[] = [];
      methods.forEach((prop) => {
        // 所有 NativeModule 的 property 都是方法签名（允许 Nullable 包裹）
        if (prop && typeof prop.name === "string") {
          methodNames.push(prop.name);
        }
      });
      if (methodNames.length > 0) {
        modulesMap[moduleName] = methodNames;
      }
    }
  });

  const simple: SimpleSignatures = {
    components: Array.from(componentsSet).sort(),
    modules: modulesMap,
  };

  return simple;
};
