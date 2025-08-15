#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 更新 packages/@xrnjs 下所有包的 peerDependencies 中 @xrnjs 开头的依赖版本为 *
 */
function updateXrnjsPeerDependencies() {
  const packagesDir = path.join(__dirname, '..', 'packages', '@xrnjs');
  
  // 检查目录是否存在
  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages/@xrnjs 目录不存在');
    process.exit(1);
  }

  // 获取所有包目录
  const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📦 找到 ${packageDirs.length} 个包:`);
  packageDirs.forEach(dir => console.log(`  - ${dir}`));
  console.log('');

  let updatedCount = 0;
  let totalCount = 0;

  // 遍历每个包目录
  packageDirs.forEach(packageDir => {
    const packageJsonPath = path.join(packagesDir, packageDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`⚠️  ${packageDir}: package.json 不存在，跳过`);
      return;
    }

    try {
      // 读取 package.json
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      totalCount++;
      let hasChanges = false;

      // 检查是否有 peerDependencies
      if (packageJson.peerDependencies) {
        const originalPeerDeps = { ...packageJson.peerDependencies };
        
        // 遍历 peerDependencies，找到 @xrnjs 开头的依赖
        Object.keys(packageJson.peerDependencies).forEach(depName => {
          if (depName.startsWith('@xrnjs/')) {
            const currentVersion = packageJson.peerDependencies[depName];
            if (currentVersion !== '*') {
              packageJson.peerDependencies[depName] = '*';
              hasChanges = true;
              console.log(`  🔄 ${depName}: ${currentVersion} → *`);
            }
          }
        });

        // 如果有变化，写回文件
        if (hasChanges) {
          const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
          fs.writeFileSync(packageJsonPath, updatedContent, 'utf8');
          updatedCount++;
          console.log(`✅ ${packageDir}: 已更新 peerDependencies`);
        } else {
          console.log(`ℹ️  ${packageDir}: 无需更新`);
        }
      } else {
        console.log(`ℹ️  ${packageDir}: 没有 peerDependencies`);
      }

    } catch (error) {
      console.error(`❌ ${packageDir}: 处理失败 - ${error.message}`);
    }
  });

  console.log('');
  console.log(`📊 总结:`);
  console.log(`  - 总包数: ${totalCount}`);
  console.log(`  - 已更新: ${updatedCount}`);
  console.log(`  - 无需更新: ${totalCount - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('');
    console.log('🎉 所有 @xrnjs 开头的 peerDependencies 版本已更新为 *');
  } else {
    console.log('');
    console.log('✨ 所有包都已经是正确的版本格式');
  }
}

// 运行脚本
if (require.main === module) {
  updateXrnjsPeerDependencies();
}

module.exports = { updateXrnjsPeerDependencies }; 