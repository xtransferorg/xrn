"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiData = void 0;
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
const typedoc_1 = require("typedoc");
const recursive_omit_by_1 = __importDefault(require("recursive-omit-by"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const MINIFY_JSON = true;
const generateApiData = async (opts) => {
    const { packageName, entryPoint = 'index.tsx', sdk } = opts;
    const dataPath = path_1.default.join(Constants_1.XRN_DIR, "docs", "public", "static", "data", 
    // "v1.0.0" // todo
    sdk ? `v${sdk}.0.0` : `unversioned`);
    const jsonFileName = packageName;
    const basePath = path_1.default.join(Constants_1.PACKAGES_DIR, packageName);
    const entriesPath = path_1.default.join(basePath, "src");
    const tsConfigPath = path_1.default.join(basePath, "tsconfig.json");
    const jsonOutputPath = path_1.default.join(dataPath, `${jsonFileName}.json`);
    const entryPoints = Array.isArray(entryPoint)
        ? entryPoint.map((entry) => path_1.default.join(entriesPath, entry))
        : [path_1.default.join(entriesPath, entryPoint)];
    // console.log(entriesPath);
    const app = await typedoc_1.Application.bootstrapWithPlugins({
        entryPoints,
        tsconfig: tsConfigPath,
        disableSources: true,
        hideGenerator: true,
        excludePrivate: true,
        excludeProtected: true,
        skipErrorChecking: true,
        excludeExternals: true,
        jsDocCompatibility: false,
        pretty: !MINIFY_JSON,
    }, [new typedoc_1.TSConfigReader(), new typedoc_1.TypeDocReader()]);
    const project = await app.convert();
    if (project) {
        await app.generateJson(project, jsonOutputPath);
        const output = await fs_extra_1.default.readJson(jsonOutputPath);
        output.name = jsonFileName;
        if (Array.isArray(entryPoint)) {
            const filterEntries = entryPoint.map((entry) => entry.substring(0, entry.lastIndexOf(".")));
            output.children = output.children
                .filter((entry) => filterEntries.includes(entry.name))
                .map((entry) => entry.children)
                .flat()
                .sort((a, b) => a.name.localeCompare(b.name));
        }
        const { readme, symbolIdMap, ...trimmedOutput } = output;
        if (MINIFY_JSON) {
            const minifiedJson = (0, recursive_omit_by_1.default)(trimmedOutput, ({ key, node }) => ["id", "groups", "target", "kindString", "originalName"].includes(key) ||
                (key === "flags" && !Object.keys(node).length));
            await fs_extra_1.default.writeFile(jsonOutputPath, JSON.stringify(minifiedJson, null, 0));
        }
        else {
            await fs_extra_1.default.writeFile(jsonOutputPath, JSON.stringify(trimmedOutput));
        }
    }
    else {
        throw new Error(`💥 Failed to extract API data from source code for '${packageName}' package.`);
    }
};
exports.generateApiData = generateApiData;
//# sourceMappingURL=generateApiData.js.map