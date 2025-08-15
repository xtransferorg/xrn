import path from "path";
import { XRN_DIR, PACKAGES_DIR } from "./Constants";
import { Application, TSConfigReader, TypeDocReader } from "typedoc";
import recursiveOmitBy from "recursive-omit-by";
import fs from "fs-extra";
import { GenerateApiDataOptions } from "./types";

const MINIFY_JSON = true;

export const generateApiData = async (opts: GenerateApiDataOptions) => {
  const { packageName, entryPoint = 'index.tsx', sdk } = opts;
  const dataPath = path.join(
    XRN_DIR,
    "docs",
    "public",
    "static",
    "data",
    // "v1.0.0" // todo
    sdk ? `v${sdk}.0.0` : `unversioned`
  );

  const jsonFileName = packageName;
  const basePath = path.join(PACKAGES_DIR, packageName);
  const entriesPath = path.join(basePath, "src");
  const tsConfigPath = path.join(basePath, "tsconfig.json");
  const jsonOutputPath = path.join(dataPath, `${jsonFileName}.json`);

  const entryPoints = Array.isArray(entryPoint)
    ? entryPoint.map((entry) => path.join(entriesPath, entry))
    : [path.join(entriesPath, entryPoint)];

  // console.log(entriesPath);

  const app = await Application.bootstrapWithPlugins(
    {
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
    },
    [new TSConfigReader(), new TypeDocReader()]
  );

  const project = await app.convert();

  if (project) {
    await app.generateJson(project, jsonOutputPath);
    const output = await fs.readJson(jsonOutputPath);
    output.name = jsonFileName;

    if (Array.isArray(entryPoint)) {
      const filterEntries = entryPoint.map((entry) =>
        entry.substring(0, entry.lastIndexOf("."))
      );
      output.children = output.children
        .filter((entry) => filterEntries.includes(entry.name))
        .map((entry) => entry.children)
        .flat()
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const { readme, symbolIdMap, ...trimmedOutput } = output;

    if (MINIFY_JSON) {
      const minifiedJson = recursiveOmitBy(
        trimmedOutput,
        ({ key, node }) =>
          ["id", "groups", "target", "kindString", "originalName"].includes(
            key
          ) ||
          (key === "flags" && !Object.keys(node).length)
      );
      await fs.writeFile(jsonOutputPath, JSON.stringify(minifiedJson, null, 0));
    } else {
      await fs.writeFile(jsonOutputPath, JSON.stringify(trimmedOutput));
    }
  } else {
    throw new Error(
      `💥 Failed to extract API data from source code for '${packageName}' package.`
    );
  }
};
