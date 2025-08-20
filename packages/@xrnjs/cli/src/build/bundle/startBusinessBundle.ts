/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { Args } from "@react-native-community/cli-plugin-metro/build/commands/start/runServer";
import {
  createDevServerMiddleware,
  indexPageMiddleware,
} from "@react-native-community/cli-server-api";
import { loadMetroConfig } from "./core/core";
import { releaseChecker } from "@react-native-community/cli-tools";
import { generateBusiness } from "./core/config";
import { mergeConfig } from "metro-config";
import loadReactNativeConfig from "@react-native-community/cli-config";
import enableWatchMode from "@react-native-community/cli-plugin-metro/build/commands/start/watchMode";
import Metro from "metro";
import fs from "fs";
import path from "path";
import os from "os";
import { codePushContext } from "../../codePush/codePushContext";
import { BaseLine } from "./baseline";
import bodyParser from "body-parser";
import logger from "../../utlis/logger";
import serveStatic from "serve-static";
import { BuildEnv } from "../typing";
// import { getDependenciesJson, getMetaJson } from "./utils";
import { MetaConfig } from "./interface";
import { StartTemplateManager } from "../utils/StartTemplateManager";
let version: string;

export interface StartBusinessArgs extends Args {
  project?: string;
  local?: boolean;
  verbose?: boolean;
}

interface GenerateBusinessConfig {
  project: string;
  root: string;
  hmr?: boolean;
  local?: boolean;
}

function generateBusinessConfig({
  project,
  root,
  hmr = false,
  local = false,
}: GenerateBusinessConfig) {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const cacheConfigMap = new Map<string, any & { isInitialed?: boolean }>();
  return async (config: any, { platform }) => {
    if (hmr && cacheConfigMap.has(platform)) {
      return Object.assign(cacheConfigMap.get(platform), { isInitialed: true });
    }
    try {
      const tempBase = path.resolve(os.homedir(), ".xtmp");
      const queryConfig = {
        temp: local ? tempBase : null,
        version,
        platform,
        buildEnv: BuildEnv.dev,
        project: project || "XTransfer",
      };
      let metaJson: MetaConfig = {
        modules: {},
        id: 0,
        hash: "",
        useOldApp: true,
      };
      let dependencies = {};

      if (version) {
        if (BaseLine.getInstance().hashBaseMeta()) {
          dependencies = BaseLine.getInstance().getDependenciesJson();
          metaJson = BaseLine.getInstance().getBaseLine();
        } else {
          // dependencies = await getDependenciesJson(queryConfig);
          // metaJson = await getMetaJson(queryConfig);
        }
      }

      const c1 = mergeConfig(
        config,
        generateBusiness(root, metaJson, hmr, dependencies, platform)()
      );
      hmr && cacheConfigMap.set(platform, c1);
      return c1;
    } catch (error) {
      logger.error("获取bundle数据失败. " + error);
      return config;
    }
  };
}

async function runServer(root: string, args: StartBusinessArgs) {
  const nativeConfig = loadReactNativeConfig(root);
  const initialBusinessConfig = generateBusiness(root, {
    modules: {},
    id: 0,
    hash: "",
  })();

  const metroConfig = await loadMetroConfig(
    nativeConfig,
    {
      maxWorkers: args.maxWorkers,
      port: args.port,
      resetCache: args.resetCache || true,
      watchFolders: args.watchFolders,
      projectRoot: args.projectRoot || root,
      sourceExts: args.sourceExts,
    },
    initialBusinessConfig
  );

  if (args.assetPlugins) {
    metroConfig.transformer.assetPlugins = args.assetPlugins.map((plugin) =>
      require.resolve(plugin)
    );
  }

  const { middleware, websocketEndpoints, messageSocketEndpoint } =
    createDevServerMiddleware({
      host: args.host,
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });
  middleware.use(indexPageMiddleware);
  middleware.use(bodyParser.urlencoded({ extended: false }));
  middleware.use(bodyParser.json({ limit: "10mb" }));
  middleware.use((req, res, next) => {
    if (req.method === "POST") {
      if (/\.[bundle|jsbundle]/.test(req.url) && req.body) {
        // 存储基线内容
        BaseLine.getInstance().saveBaseMeta(req.body);
      }
    }
    next();
  });

  middleware.use(
    "/assets/assets",
    serveStatic(path.resolve(__dirname, "../../../", "files/_assets"))
  );
  middleware.use((req, res, next) => {
    if (/xt-app-common\.[bundle|jsbundle]/.test(req.url)) {
      // 请求 common bundle 时，返回空 js
      // debug 时请求 common bundle 会报错，因为 common bundle 是在 native 项目中，之所以会请求是因为发生错误 sentry 会自动请求当前 bundle url 解析错误的 context
      // 本地调试时无需此功能，所以返回空 js
      try {
        const commonContent = fs.readFileSync(req.url);
        return res.end(commonContent);
      } catch {
        return res.end("(function() {})()");
      }
    }
    if (/\.bundle\?/.test(req.url)) {
      // 请求 bundle 时，获取 appVersion
      const params = new URLSearchParams(req.url.replace(/.+\?/, ""));
      const appVersion = params.get("appVersion");
      if (!appVersion) {
        return next();
      }
      if (version && version !== appVersion) {
        return next(
          new Error(
            `当前版本 ${version} 与请求版本 ${appVersion} 不一致，关闭当前服务重新 yarn start`
          )
        );
      }
      version = appVersion;
    }
    next();
  });

  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
  metroConfig.server.enhanceMiddleware = (
    metroMiddleware: any,
    server: any
  ) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }
    return middleware.use(metroMiddleware);
  };

  metroConfig.onDynamicConfig = generateBusinessConfig({
    project: args.project,
    root,
    local: args.local,
  });
  metroConfig.onDynamicHmrConfig = generateBusinessConfig({
    project: args.project,
    root,
    hmr: true,
    local: args.local,
  });

  const serverInstance = await Metro.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    // @ts-ignore
    hmrEnabled: true,
    websocketEndpoints,
  });

  if (args.interactive) {
    enableWatchMode(messageSocketEndpoint);
  }

  // In Node 8, the default keep-alive for an HTTP connection is 5 seconds. In
  // early versions of Node 8, this was implemented in a buggy way which caused
  // some HTTP responses (like those containing large JS bundles) to be
  // terminated early.
  //
  // As a workaround, arbitrarily increase the keep-alive from 5 to 30 seconds,
  // which should be enough to send even the largest of JS bundles.
  //
  // For more info: https://github.com/nodejs/node/issues/13391
  //
  serverInstance.keepAliveTimeout = 30000;

  await releaseChecker(root);
}

export async function startBusinessBundle(args: StartBusinessArgs) {
  codePushContext.verbose = args.verbose
  const startTemplateManager = await StartTemplateManager.create(process.cwd());

  await startTemplateManager.writeIndexTs();
  await runServer(
    process.cwd(),
    Object.assign(args, {
      interactive: true,
    })
  );
}
