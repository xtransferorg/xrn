/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  createDevServerMiddleware,
  indexPageMiddleware,
} from "@react-native-community/cli-server-api";
import { loadMetroConfig } from "./core/core";
import { generateBusinessBundleConfig } from "./core/config";
import { mergeConfig } from "metro-config";
import loadReactNativeConfig from "@react-native-community/cli-config";
import Metro from "metro";
import { Terminal } from "metro-core";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createDevMiddleware } = require("@react-native/dev-middleware") as {
  createDevMiddleware: (opts: {
    projectRoot: string;
    serverBaseUrl: string;
    logger?: {
      info: (m: string) => void;
      warn: (m: string) => void;
      error: (m: string) => void;
    };
  }) => { middleware: any; websocketEndpoints: Record<string, any> };
};
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { codePushContext } from "../../codePush/codePushContext";
import { BaseLine } from "./baseline";
import bodyParser from "body-parser";
import logger from "../../utlis/logger";
import serveStatic from "serve-static";
import { BuildEnv } from "../typing";
import { getDependenciesJson, getMetaJson } from "./utils";
import { MetaConfig } from "./interface";
import { StartTemplateManager } from "../utils/StartTemplateManager";

// 当前连接的 App 版本，由 bundle 请求携带的 appVersion 参数确定
let version: string;

export type MetroReporter = {
  update: (event: any) => void;
  broadcast: (type: string, params?: Record<string, unknown> | null) => void;
  openDevTools: () => void;
};

export interface StartBusinessArgs {
  project?: string;
  local?: boolean;
  verbose?: boolean;
  config?: string;
  maxWorkers?: number;
  port?: number;
  resetCache?: boolean;
  watchFolders?: string[];
  projectRoot?: string;
  sourceExts?: string[];
  assetPlugins?: string[];
  host?: string;
  https?: boolean;
  cert?: string;
  key?: string;
  /** Metro 初始化完成时的回调，此时 reporter 已可用 */
  onInitializeDone?: (reporter: MetroReporter) => void;
}

interface GenerateBusinessConfigOptions {
  project: string;
  root: string;
  hmr?: boolean;
  local?: boolean;
}

// ---------------------------------------------------------------------------
// 动态 bundle 配置：每次请求 bundle 时，根据 appVersion 动态调整 Metro 配置
// ---------------------------------------------------------------------------
function makeBusinessConfigFactory({
  project,
  root,
  hmr = false,
  local = false,
}: GenerateBusinessConfigOptions) {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const cacheConfigMap = new Map<string, any & { isInitialed?: boolean }>();

  return async (config: any, { platform }: { platform: any }) => {
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
        project: project || "xrn",
      };

      let metaJson: MetaConfig = { modules: {}, id: 0, hash: "", useOldApp: true };
      let dependencies = {};

      if (version) {
        if (BaseLine.getInstance().hashBaseMeta()) {
          dependencies = BaseLine.getInstance().getDependenciesJson();
          metaJson = BaseLine.getInstance().getBaseLine();
        } else {
          dependencies = await getDependenciesJson(queryConfig);
          metaJson = await getMetaJson(queryConfig);
        }
      }

      const mergedConfig = mergeConfig(
        config,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        generateBusinessBundleConfig(root, metaJson, hmr, dependencies, platform)()
      );
      hmr && cacheConfigMap.set(platform, mergedConfig);
      return mergedConfig;
    } catch (error) {
      logger.error("获取bundle数据失败. " + error);
      return config;
    }
  };
}

// ---------------------------------------------------------------------------
// 核心服务启动（结构对齐官方 community-cli-plugin/src/commands/start/runServer.js）
// ---------------------------------------------------------------------------
async function runServer(root: string, args: StartBusinessArgs): Promise<MetroReporter> {
  // 1. 加载 Metro 配置（叠加业务初始 bundle 配置）
  const nativeConfig = loadReactNativeConfig({ projectRoot: root });
  const initialBusinessConfig = generateBusinessBundleConfig(root, {
    modules: {},
    id: 0,
    hash: "",
  })();

  const metroConfig = await loadMetroConfig(
    nativeConfig,
    {
      maxWorkers: args.maxWorkers,
      port: args.port,
      resetCache: args.resetCache ?? true,
      watchFolders: args.watchFolders,
      projectRoot: args.projectRoot || root,
      sourceExts: args.sourceExts,
    },
    initialBusinessConfig
  );

  // 2. 解构关键配置（与官方保持一致）
  const hostname = args.host?.length ? args.host : "localhost";
  const {
    projectRoot,
    server: { port },
    watchFolders,
  } = metroConfig;
  const protocol = args.https === true ? "https" : "http";
  const devServerUrl = `${protocol}://${hostname}:${port}`;

  console.info(`Starting dev server on ${devServerUrl}\n`);

  // 3. assetPlugins
  if (args.assetPlugins) {
    // $FlowIgnore[cannot-write]
    metroConfig.transformer.assetPlugins = args.assetPlugins.map((plugin) =>
      require.resolve(plugin)
    );
  }

  // 4. 创建 TerminalReporter（官方：每次启动创建新实例，避免共用旧实例导致的日志串扰）
  const terminal = new Terminal(process.stdout);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TerminalReporterImpl = require("metro/src/lib/TerminalReporter");
  const terminalReporter = new TerminalReporterImpl(terminal);

  // 5. 创建社区中间件（消息 WebSocket、事件 WebSocket、debugger 代理等）
  const {
    middleware: communityMiddleware,
    websocketEndpoints: communityWebsocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = createDevServerMiddleware({ host: hostname, port, watchFolders });

  // 6. 挂载业务自定义中间件到 communityMiddleware
  communityMiddleware.use(bodyParser.urlencoded({ extended: false }));
  communityMiddleware.use(bodyParser.json({ limit: "10mb" }));

  // URL 匹配说明：下方使用 /\.[bundle|jsbundle]/、/xt-app-common\.[bundle|jsbundle]/ 等形式（字符类），
  // 与历史 bundle 请求路径的匹配习惯一致，当前业务 URL 下行为符合预期；若未来要严格匹配 .bundle / .jsbundle 后缀，再改为 \.(?:bundle|jsbundle)。

  // 6a. 保存基线：native 通过 POST 上报 baseline meta
  communityMiddleware.use((req: any, res: any, next: any) => {
    if (req.method === "POST" && /\.[bundle|jsbundle]/.test(req.url) && req.body) {
      BaseLine.getInstance().saveBaseMeta(req.body);
    }
    next();
  });

  // 6b. 静态资源服务
  communityMiddleware.use(
    "/assets/assets",
    serveStatic(path.resolve(__dirname, "../../../", "files/_assets"))
  );

  // 6c. common bundle 拦截 + appVersion 版本绑定
  communityMiddleware.use((req: any, res: any, next: any) => {
    if (/xt-app-common\.[bundle|jsbundle]/.test(req.url)) {
      // common bundle 在 native 侧，本地调试场景直接返回空模块即可。
      try {
        return res.end(fs.readFileSync(req.url));
      } catch {
        return res.end("(function() {})()");
      }
    }
    if (/\.bundle\?/.test(req.url)) {
      const params = new URLSearchParams(req.url.replace(/.+\?/, ""));
      const appVersion = params.get("appVersion");
      if (!appVersion) return next();
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

  // 7. 创建 DevTools 中间件（Chrome DevTools Protocol / Inspector 代理）
  const { middleware: devMiddleware, websocketEndpoints: devWebsocketEndpoints } =
    createDevMiddleware({
      projectRoot,
      serverBaseUrl: devServerUrl,
      logger: {
        info: (msg: string) =>
          terminalReporter.update({ type: "unstable_server_log", level: "info", data: msg }),
        warn: (msg: string) =>
          terminalReporter.update({ type: "unstable_server_log", level: "warn", data: msg }),
        error: (msg: string) =>
          terminalReporter.update({ type: "unstable_server_log", level: "error", data: msg }),
      },
    });

  // 8. 动态 bundle 配置（每次 bundle 请求时根据 appVersion 拉取基线数据）
  metroConfig.onDynamicConfig = makeBusinessConfigFactory({
    project: args.project,
    root,
    local: args.local,
  });
  metroConfig.onDynamicHmrConfig = makeBusinessConfigFactory({
    project: args.project,
    root,
    hmr: true,
    local: args.local,
  });

  // 9. Reporter（官方模式：新建实例，通过闭包持有 reportEvent 引用，initialize_done 时触发 onInitializeDone 回调）
  // eslint-disable-next-line prefer-const
  let reportEvent: ((event: any) => void) | undefined;
  const reporter: MetroReporter = {
    update(event: any) {
      terminalReporter.update(event);
      if (reportEvent) {
        reportEvent(event);
      }
      if (event.type === "initialize_done") {
        terminalReporter.update({
          type: "unstable_server_log",
          level: "info",
          data: `Dev server ready. ${chalk.dim("Press Ctrl+C to exit.")}`,
        });
        args.onInitializeDone?.(reporter);
      }
    },
    broadcast(type, params) {
      messageSocketEndpoint.broadcast(type, params);
    },
    openDevTools() {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("child_process").exec(`curl -s -X POST "${devServerUrl}/open-debugger" > /dev/null`);
    },
  };
  // $FlowIgnore[cannot-write]
  metroConfig.reporter = reporter;

  // 10. 启动 Metro 服务（官方顺序：communityMiddleware → indexPage → devMiddleware）
  const serverInstance = await Metro.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    // @ts-ignore
    hmrEnabled: true,
    unstable_extraMiddleware: [communityMiddleware, indexPageMiddleware, devMiddleware],
    websocketEndpoints: {
      ...communityWebsocketEndpoints,
      ...devWebsocketEndpoints,
    },
  });

  // 11. 将 eventsSocket 的上报函数挂到 reporter，使 Metro 事件广播给调试工具（Flipper 等）
  reportEvent = eventsSocketEndpoint.reportEvent;

  // 12. 增大 keep-alive 超时，防止大 bundle 传输被提前断开（Node 8 兼容性问题遗留）
  serverInstance.keepAliveTimeout = 30000;

  return reporter;
}

// ---------------------------------------------------------------------------
// 公共入口
// ---------------------------------------------------------------------------
export async function startBusinessBundle(
  args: StartBusinessArgs,
): Promise<MetroReporter> {
  codePushContext.verbose = args.verbose;
  const cwd = process.cwd();

  const startTemplateManager = await StartTemplateManager.create(cwd);
  await startTemplateManager.writeIndexTs();

  return runServer(cwd, args);
}
