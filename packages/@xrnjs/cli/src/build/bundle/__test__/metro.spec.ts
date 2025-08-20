/* eslint-disable @typescript-eslint/no-unsafe-argument */
import path from "path";
import { loadMetroConfig } from "../core/core";

describe("metro", () => {
  it("should read metro config", async () => {
    const loadReactNativeConfig =
      require("@react-native-community/cli-config").default;
    const basePath = path.resolve(__dirname, "_fixtures");
    const config = loadReactNativeConfig(basePath);
    const createModuleIdFactory = () => {
      return () => 0;
    };
    const realConfig = await loadMetroConfig(
      config,
      { projectRoot: basePath, resetCache: true },
      {
        serializer: {
          createModuleIdFactory: createModuleIdFactory,
        },
      }
    );
    expect(realConfig.serializer.createModuleIdFactory).toBe(
      createModuleIdFactory
    );
  });
});
