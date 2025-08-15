import { invalidatePatch } from "../utils";
import path from "path";

describe("patch", () => {
  it("should be able to parse patch file", async () => {
    const p = await invalidatePatch(path.resolve(__dirname, "_patches"), {
      modules: {},
      id: 1,
      hash: ''
    });
    expect(p.length).toBe(1);
  });

  it("should throw error if patch path already exists in common bundle", async () => {
    try {
      await invalidatePatch(path.resolve(__dirname, "_patches"), {
        modules: {
          "node_modules/react-native/index.js": {
            id: 1,
            version: "0.0.1",
          },
        },
        id: 2,
        hash: ''
      });
    } catch (e) {
      expect(e.message).toBe(
        `node_modules/react-native/index.js 模块维护在 common bundle 中，不允许对其进行 patch`
      );
    }
  });
});
