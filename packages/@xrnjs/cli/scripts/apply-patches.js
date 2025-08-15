const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const packageName = require("../package.json").name;
const packageRoot = path.join(root, "node_modules", packageName);

function removeUnusedPatches() {
  const patchesDir = path.join(packageRoot, "scripts", "patches");
  const tempPatchesDir = path.join(packageRoot, "scripts", "patches-temp");
  if (!fs.existsSync(patchesDir)) return tempPatchesDir;

  // 复制 patches 到 patches-temp
  if (fs.existsSync(tempPatchesDir)) {
    fs.rmSync(tempPatchesDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempPatchesDir, { recursive: true });
  fs.readdirSync(patchesDir).forEach((file) => {
    fs.copyFileSync(
      path.join(patchesDir, file),
      path.join(tempPatchesDir, file)
    );
  });

  // 删除无用 patch 文件
  const patchFiles = fs
    .readdirSync(tempPatchesDir)
    .filter((f) => f.endsWith(".patch"));
  patchFiles.forEach((file) => {
    const match = file.match(/^((@[^+]+\+)?[^+]+)\+.+\.patch$/);
    if (!match) return;
    const pkgName = match[1].replace(/\+/g, "/");
    const pkgPath = path.join(root, "node_modules", pkgName);
    if (!fs.existsSync(pkgPath)) {
      fs.unlinkSync(path.join(tempPatchesDir, file));
      console.log(`🗑️ 删除无用 patch: ${file}`);
    }
  });
  return tempPatchesDir;
}

// 执行 patch 逻辑
function applyPatches() {
  console.log(`Applying patch to ${root}...`);
  removeUnusedPatches();
  try {
    execSync(
      `npx patch-package --patch-dir node_modules/${packageName}/scripts/patches-temp`,
      {
        stdio: "inherit",
        cwd: root,
      }
    );
    console.log("✅ Patch applied successfully.");
  } catch (error) {
    console.error("❌ Failed to apply patch:", error);
  }
}
module.exports = {
  applyPatches,
};
