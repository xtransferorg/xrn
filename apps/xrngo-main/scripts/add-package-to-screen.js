const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

// 输入的 npm 包名
const npmPackageName = process.argv[2];

if (!npmPackageName) {
  console.error('请提供 npm 包名作为参数。');
  process.exit(1);
}

// 处理包名，转换为适合的格式
const sanitizedPackageName = lodash
  .startCase(lodash.camelCase(npmPackageName)) // 转换为驼峰格式
  .replace(/[^a-zA-Z0-9]/g, '') // 移除特殊字符
  .replace(/^_/, ''); // 移除开头的下划线

// 读取并解析 JSON 文件
const configFilePath = path.join(__dirname, '../screens.json');

fs.readFile(configFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }

  let config;
  try {
    config = JSON.parse(data);
  } catch (parseErr) {
    console.error('解析 JSON 文件失败:', parseErr);
    return;
  }

  // 检查是否已存在相同的项
  const exists = config.some(item => item.name === sanitizedPackageName);
  if (exists) {
    console.log(`配置中已存在项：${sanitizedPackageName}`);
    return;
  }

  // 创建新项
  const newItem = {
    name: sanitizedPackageName,
    title: sanitizedPackageName,
  };

  // 添加新项到配置
  config.push(newItem);

  // 写回文件
  fs.writeFile(
    configFilePath,
    JSON.stringify(config, null, 2),
    'utf8',
    writeErr => {
      if (writeErr) {
        console.error('写入文件失败:', writeErr);
        return;
      }
      console.log(`成功添加项：${JSON.stringify(newItem, null, 2)}`);
    },
  );
});
