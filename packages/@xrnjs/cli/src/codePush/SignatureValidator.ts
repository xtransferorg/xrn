import fs from "fs-extra";
import logger from "../utlis/logger";
import { BuildEnv, BuildType, Platform } from "../build/typing";
import { getSignatureSchema } from "../build/utils/generateSignatures";
import type {
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  Nullable,
  SchemaType,
  UnsafeAnyTypeAnnotation,
} from "@react-native/codegen/lib/CodegenSchema";
import path from "path";
import { BaselineManagerFactory } from "../build/BaselineManagerFactory";

export class SignatureValidator {
  private platform: Platform;
  private env: BuildEnv;
  private buildType: BuildType;

  constructor(params: {
    buildType: BuildType;
    platform: Platform;
    env: BuildEnv;
  }) {
    this.platform = params.platform;
    this.env = params.env;
    this.buildType = params.buildType;
  }

  private async getBaseline(version: string) {
    const baselineManager = BaselineManagerFactory.createOrGet({
      platform: this.platform,
      version: version,
      buildEnv: this.env,
      buildType: this.buildType
    });
    return await baselineManager.getSignatureJson();
  }

  async validateBundleSignature(version: string, latestVersion: string) {
    // 复制 files/react-native-config.js 到 bundlePath/react-native-config.js，存在则覆盖
    const reactNativeConfigPath = path.join(
      process.cwd(),
      "react-native.config.js"
    );
    fs.copyFileSync(
      path.join(__dirname, "..", "..", "files", "react-native.config.js"),
      reactNativeConfigPath
    );
    const current = await getSignatureSchema(this.platform);
    const baseline = await this.getBaseline(version);
    let latestBaseline = baseline;
    if (latestVersion !== version) {
      latestBaseline = await this.getBaseline(latestVersion);
    }

    if (!baseline || !baseline.modules || !current.modules) {
      throw new Error("签名结构不完整，无法进行校验");
    }

    // 1) 校验针对最新版本：不允许新增模块/方法（基线缺失即报错）
    logger.info(
      `开始进行签名校验，基线版本: ${latestVersion}，当前版本: ${version}`
    );

    logger.info(`校验针对最新版本 ${latestVersion}：不允许新增模块/方法`);
    this.validateSignature(current, latestBaseline, {
      addedModuleSeverity: "error",
      addedMethodSeverity: "error",
      removedModuleSeverity: "none",
      removedMethodSeverity: "none",
    });

    if (latestVersion !== version) {
      // 2) 校验针对当前版本：允许新增（作为告警）
      logger.info(`校验针对当前版本 ${version}：允许新增模块/方法（告警）`);
      this.validateSignature(current, baseline, {
        addedModuleSeverity: "warn",
        addedMethodSeverity: "warn",
        removedModuleSeverity: "none",
        removedMethodSeverity: "none",
      });
    }
  }

  async validateNativeSignature(stableVersion: string) {
    const current = await getSignatureSchema(this.platform);
    const stableBaseline = await this.getBaseline(stableVersion);

    if (!stableBaseline || !stableBaseline.modules || !current.modules) {
      throw new Error("签名结构不完整，无法进行校验");
    }

    // 校验针对稳定版本：不允许删除模块/方法
    this.validateSignature(current, stableBaseline, {
      addedModuleSeverity: "warn",
      addedMethodSeverity: "warn",
      removedModuleSeverity: "error",
      removedMethodSeverity: "error",
    });
  }

  private validateSignature(
    current: SchemaType,
    baseline: SchemaType,
    options?: {
      addedModuleSeverity?: "none" | "warn" | "error";
      removedModuleSeverity?: "none" | "warn" | "error";
      addedMethodSeverity?: "none" | "warn" | "error";
      removedMethodSeverity?: "none" | "warn" | "error";
    }
  ) {
    const addedModuleSeverity = options?.addedModuleSeverity ?? "warn";
    const removedModuleSeverity = options?.removedModuleSeverity ?? "warn";
    const addedMethodSeverity = options?.addedMethodSeverity ?? "warn";
    const removedMethodSeverity = options?.removedMethodSeverity ?? "warn";

    const errors: string[] = [];
    const warnings: string[] = [];

    const pushBySeverity = (
      severity: "none" | "warn" | "error",
      message: string
    ) => {
      if (severity === "none") {
        return; // 不记录为警告或错误
      }
      if (severity === "error") {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    };

    // 使用 diff 进行对比（from=baseline, to=current）
    const diff = this.diffSchemas(baseline, current);

    // 新增/删除根据配置设定严重程度
    diff.addedModules.forEach((m) =>
      pushBySeverity(addedModuleSeverity, `新增模块: ${m}`)
    );
    diff.removedModules.forEach((m) =>
      pushBySeverity(removedModuleSeverity, `删除模块: ${m}`)
    );

    // 方法的新增/删除严重度可配置；签名变更固定报错
    diff.modifiedModules.forEach((mod) => {
      mod.addedMethods.forEach((name) => {
        pushBySeverity(
          addedMethodSeverity,
          `模块 ${mod.module} 新增方法: ${name}`
        );
      });
      mod.removedMethods.forEach((name) => {
        pushBySeverity(
          removedMethodSeverity,
          `模块 ${mod.module} 删除方法: ${name}`
        );
      });
      mod.changedMethods.forEach((name) => {
        errors.push(`方法签名不一致: ${mod.module}.${name}`);
      });
    });

    warnings.forEach((w) => logger.warn(`[签名校验] ${w}`));
    if (errors.length > 0) {
      errors.forEach((e) => logger.error(`[签名校验] ${e}`));
      throw new Error("签名校验失败");
    }
    logger.info("[签名校验] 通过");
  }

  private compareProperty(
    moduleKey: string,
    cur: NativeModulePropertyShape,
    base: NativeModulePropertyShape,
    errors: string[]
  ) {
    if (!!cur.optional !== !!base.optional) {
      errors.push(`方法可选性不一致: ${moduleKey}.${cur.name}`);
      return;
    }
    this.compareTypeAnnotation(
      `${moduleKey}.${cur.name}`,
      cur.typeAnnotation,
      base.typeAnnotation,
      errors
    );
  }

  private compareTypeAnnotation(
    ctx: string,
    cur: Nullable<NativeModuleTypeAnnotation>,
    base: Nullable<NativeModuleTypeAnnotation>,
    errors: string[]
  ) {
    if (!cur || !base) {
      errors.push(`类型缺失: ${ctx}`);
      return;
    }
    if (cur.type !== base.type) {
      errors.push(`类型不一致: ${ctx} (${cur.type} != ${base.type})`);
      return;
    }

    switch (cur.type) {
      case "FunctionTypeAnnotation": {
        const baseFunc = base as typeof cur;
        this.compareTypeAnnotation(
          `${ctx}.return`,
          cur.returnTypeAnnotation,
          baseFunc.returnTypeAnnotation,
          errors
        );
        const curParams = cur.params ?? [];
        const baseParams = baseFunc.params ?? [];
        if (curParams.length !== baseParams.length) {
          errors.push(
            `参数数量不一致: ${ctx} (${curParams.length} != ${baseParams.length})`
          );
        } else {
          for (let i = 0; i < curParams.length; i++) {
            const cp = curParams[i];
            const bp = baseParams[i];
            if (!!cp.optional !== !!bp.optional) {
              errors.push(`参数可选性不一致: ${ctx} 第${i + 1}个参数`);
              break;
            }
            // 参数名不强制一致，只比对类型
            this.compareTypeAnnotation(
              `${ctx}.param[${i}]`,
              cp.typeAnnotation,
              bp.typeAnnotation,
              errors
            );
            if (errors.length > 0) break;
          }
        }
        return;
      }
      case "PromiseTypeAnnotation": {
        const basePromise = base as typeof cur;
        const curElement = cur.elementType;
        const baseElement = basePromise.elementType;
        this.compareTypeAnnotation(
          `${ctx}.element`,
          curElement as Nullable<NativeModuleTypeAnnotation>,
          baseElement as Nullable<NativeModuleTypeAnnotation>,
          errors
        );
        return;
      }
      case "NullableTypeAnnotation": {
        const baseNullable = base as typeof cur;
        this.compareTypeAnnotation(
          `${ctx}.type`,
          cur.typeAnnotation,
          baseNullable.typeAnnotation,
          errors
        );
        return;
      }
      case "ArrayTypeAnnotation": {
        const curArray = cur as NativeModuleArrayTypeAnnotation<
          Nullable<NativeModuleBaseTypeAnnotation>
        >;
        const baseArray = base as NativeModuleArrayTypeAnnotation<
          Nullable<NativeModuleBaseTypeAnnotation>
        >;
        // 这几类都有 elementType
        if (curArray.elementType && baseArray.elementType) {
          if (
            this.isUnsafeAnyTypeAnnotation(curArray.elementType) ||
            this.isUnsafeAnyTypeAnnotation(baseArray.elementType)
          ) {
            return;
          }
          this.compareTypeAnnotation(
            `${ctx}.element`,
            curArray.elementType as Nullable<NativeModuleTypeAnnotation>,
            baseArray.elementType as Nullable<NativeModuleTypeAnnotation>,
            errors
          );
        } else if (!!curArray.elementType !== !!baseArray.elementType) {
          errors.push(`元素类型缺失: ${ctx}`);
        }
        return;
      }
      case "ObjectTypeAnnotation": {
        const baseObject = base as typeof cur;
        const curProps = cur.properties ?? [];
        const baseProps = baseObject.properties ?? [];
        if (curProps.length !== baseProps.length) {
          errors.push(`对象属性数量不一致: ${ctx}`);
          return;
        }
        for (let i = 0; i < curProps.length; i++) {
          const cp = curProps[i];
          const bp = baseProps[i];
          if (cp.name !== bp.name) {
            errors.push(`对象属性名不一致: ${ctx} (${cp.name} != ${bp.name})`);
            return;
          }
          if (!!cp.optional !== !!bp.optional) {
            errors.push(`对象属性可选性不一致: ${ctx}.${cp.name}`);
            return;
          }
          this.compareTypeAnnotation(
            `${ctx}.${cp.name}`,
            cp.typeAnnotation,
            bp.typeAnnotation,
            errors
          );
          if (errors.length > 0) return;
        }
        return;
      }
      case "TypeAliasTypeAnnotation": {
        const baseAlias = base as typeof cur;
        if (cur.name !== baseAlias.name) {
          errors.push(
            `类型别名不一致: ${ctx} (${cur.name} != ${baseAlias.name})`
          );
        }
        return;
      }
      default:
        // 基本类型：只需类型名一致，已在前面判断
        return;
    }
  }

  private isUnsafeAnyTypeAnnotation(
    annotation: unknown
  ): annotation is UnsafeAnyTypeAnnotation {
    return (
      !!annotation &&
      typeof annotation === "object" &&
      (annotation as UnsafeAnyTypeAnnotation).type === "AnyTypeAnnotation"
    );
  }

  // ============ 新增：签名差异计算与辅助方法 ============
  private isSamePropertySignature(
    moduleKey: string,
    cur: NativeModulePropertyShape,
    base: NativeModulePropertyShape
  ): boolean {
    const tmpErrors: string[] = [];
    this.compareProperty(moduleKey, cur, base, tmpErrors);
    return tmpErrors.length === 0;
  }

  private isNativeModuleSchema(mod: any): mod is NativeModuleSchema {
    return !!mod && mod.type === "NativeModule";
  }

  private diffSchemas(
    fromSchema: SchemaType,
    toSchema: SchemaType
  ): {
    addedModules: string[];
    removedModules: string[];
    modifiedModules: Array<{
      module: string;
      addedMethods: string[];
      removedMethods: string[];
      changedMethods: string[];
    }>;
  } {
    const addedModules: string[] = [];
    const removedModules: string[] = [];
    const modifiedModules: Array<{
      module: string;
      addedMethods: string[];
      removedMethods: string[];
      changedMethods: string[];
    }> = [];

    const fromModules = fromSchema.modules || {};
    const toModules = toSchema.modules || {};
    const fromKeys = new Set(Object.keys(fromModules));
    const toKeys = new Set(Object.keys(toModules));

    // 模块新增/删除
    for (const key of toKeys) {
      if (!fromKeys.has(key)) addedModules.push(key);
    }
    for (const key of fromKeys) {
      if (!toKeys.has(key)) removedModules.push(key);
    }

    // 交集模块，计算方法级 diff
    for (const key of toKeys) {
      if (!fromKeys.has(key)) continue;
      const fromModAny = fromModules[key];
      const toModAny = toModules[key];

      // 仅处理 NativeModule
      if (!this.isNativeModuleSchema(toModAny)) continue;
      if (!this.isNativeModuleSchema(fromModAny)) {
        // 类型变化，视为整体方法变更：把 to 的方法都标记为 changed
        const props = toModAny.spec?.methods ?? [];
        const changed = props
          .map((p) => p?.name)
          .filter((n): n is string => typeof n === "string");
        if (changed.length > 0) {
          modifiedModules.push({
            module: key,
            addedMethods: [],
            removedMethods: [],
            changedMethods: changed,
          });
        }
        continue;
      }

      const fromProps = (fromModAny.spec?.methods ?? []).filter(Boolean);
      const toProps = (toModAny.spec?.methods ?? []).filter(Boolean);

      const fromMap = new Map<string, NativeModulePropertyShape>();
      fromProps.forEach((p) => {
        if (p?.name) fromMap.set(p.name, p);
      });
      const toMap = new Map<string, NativeModulePropertyShape>();
      toProps.forEach((p) => {
        if (p?.name) toMap.set(p.name, p);
      });

      const fromNames = new Set(fromMap.keys());
      const toNames = new Set(toMap.keys());

      const addedMethods: string[] = [];
      const removedMethods: string[] = [];
      const changedMethods: string[] = [];

      // 新增/删除方法
      for (const n of toNames) if (!fromNames.has(n)) addedMethods.push(n);
      for (const n of fromNames) if (!toNames.has(n)) removedMethods.push(n);

      // 共有方法，检测签名变更
      for (const n of toNames) {
        if (!fromNames.has(n)) continue;
        const curProp = toMap.get(n);
        const baseProp = fromMap.get(n);
        if (
          curProp &&
          baseProp &&
          !this.isSamePropertySignature(key, curProp, baseProp)
        ) {
          changedMethods.push(n);
        }
      }

      if (
        addedMethods.length > 0 ||
        removedMethods.length > 0 ||
        changedMethods.length > 0
      ) {
        modifiedModules.push({
          module: key,
          addedMethods,
          removedMethods,
          changedMethods,
        });
      }
    }

    return { addedModules, removedModules, modifiedModules };
  }
}
