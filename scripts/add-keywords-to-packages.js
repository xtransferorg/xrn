#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 为 packages/@xrnjs 下所有包的 keywords 中添加新的关键词
 */
function addKeywordsToPackages() {
  const packagesDir = path.join(__dirname, '..', 'packages', '@xrnjs');
  
  // 要添加的新关键词
  const newKeywords = [
    'xrnjs',
    'xrn',
  ];
  
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
  
  console.log(`🔑 要添加的关键词: ${newKeywords.join(', ')}`);
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

      // 确保 keywords 字段存在
      if (!packageJson.keywords) {
        packageJson.keywords = [];
        hasChanges = true;
        console.log(`  ➕ ${packageDir}: 创建 keywords 字段`);
      }

      // 获取当前的关键词
      const currentKeywords = packageJson.keywords || [];
      const originalKeywords = [...currentKeywords];
      
      // 添加新的关键词（避免重复）
      newKeywords.forEach(keyword => {
        if (!currentKeywords.includes(keyword)) {
          currentKeywords.push(keyword);
          hasChanges = true;
          console.log(`  🔑 ${packageDir}: 添加关键词 "${keyword}"`);
        }
      });

      // 如果有变化，更新 package.json
      if (hasChanges) {
        packageJson.keywords = currentKeywords;
        const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
        fs.writeFileSync(packageJsonPath, updatedContent, 'utf8');
        updatedCount++;
        console.log(`✅ ${packageDir}: 已更新 keywords`);
        console.log(`   原关键词: [${originalKeywords.join(', ')}]`);
        console.log(`   新关键词: [${currentKeywords.join(', ')}]`);
      } else {
        console.log(`ℹ️  ${packageDir}: 无需更新 (所有关键词已存在)`);
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
    console.log('🎉 所有包的关键词已更新完成');
  } else {
    console.log('');
    console.log('✨ 所有包都已经包含了所需的关键词');
  }
}

// 运行脚本
if (require.main === module) {
  addKeywordsToPackages();
}

module.exports = { addKeywordsToPackages }; 