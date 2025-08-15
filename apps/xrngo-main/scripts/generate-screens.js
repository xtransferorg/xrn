const fs = require('fs');
const path = require('path');

const generateScreens = (jsonFilePath, outputFilePath) => {
  // 读取 JSON 文件
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

  // 生成 TypeScript 文件内容
  const tsContent = `// 不要修改这个文件，这个文件是由 generateScreens.js 自动生成的
import {ScreenConfig} from '../types/ScreenConfig';
import {optionalRequire} from './routeBuilder';

export const Screens: ScreenConfig[] = [
${jsonData
  .map(
    screen => `  {
    getComponent() {
      return optionalRequire(() => require('../screens/${screen.name}Screen'));
    },
    name: '${screen.name}',
    options: {
      title: '${screen.title}',
    },
    showName: '${screen.showName}',
    description: '${screen.description}',
    group: '${screen.group}',
    packageName: '${screen.packageName}',
    sdkPath: ${screen.sdkPath ? `'${screen.sdkPath}'` : 'undefined'},
  },`,
  )
  .join('\n')}
];
`;

  // 写入 TypeScript 文件
  fs.writeFileSync(outputFilePath, tsContent, 'utf-8');
};

// 定义 JSON 文件和输出文件的路径
const jsonFilePath = path.join(__dirname, '../screens.json');
const outputFilePath = path.join(__dirname, '../src/navigation/Screens.tsx');

console.log(jsonFilePath, outputFilePath);

// 生成 TypeScript 文件
generateScreens(jsonFilePath, outputFilePath);
