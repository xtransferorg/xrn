const fs = require('fs');
const path = require('path');

// 配置文件路径
const configFilePath = path.join(__dirname, '../screens.json');
// 生成文件夹路径
const outputDir = path.join(__dirname, '../src/screens');

// 读取配置文件
fs.readFile(configFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('读取配置文件失败:', err);
    return;
  }

  let config;
  try {
    config = JSON.parse(data);
  } catch (parseErr) {
    console.error('解析 JSON 文件失败:', parseErr);
    return;
  }

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true});
  }

  // 遍历配置，生成文件
  config.forEach(item => {
    const fileName = `${item.name}Screen.tsx`;
    const filePath = path.join(outputDir, fileName);

    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      console.log(`文件已存在：${filePath}`);
      return;
    }

    // 生成文件内容
    const fileContent = `import * as React from 'react';
import {Button} from 'react-native';

import {Page, Section} from '../components/Page';

export default function ${item.name}Screen() {
  return (
    <Page>
      <Section title="Default">
        <Button title="${item.name}" onPress={() => {}} />
      </Section>
    </Page>
  );
}

${item.name}Screen.navigationOptions = {
  title: '${item.title}',
};
`;

    // 写入文件
    fs.writeFile(filePath, fileContent, 'utf8', writeErr => {
      if (writeErr) {
        console.error('写入文件失败:', writeErr);
        return;
      }
      console.log(`成功生成文件：${filePath}`);
    });
  });
});
