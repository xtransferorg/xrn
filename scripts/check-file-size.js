#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAX_SIZE_MB = 10; // 限制 5MB
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

console.log('Checking file sizes...');

try {
  const output = execSync('git diff --cached --name-only').toString();
  const files = output.split('\n').filter(f => f);

  const oversizedFiles = [];

  files.forEach(file => {
    const filepath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > MAX_SIZE) {
        oversizedFiles.push({
          file,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
        });
      }
    }
  });

  if (oversizedFiles.length > 0) {
    console.error('\n❌ 检测到超大文件，提交被中断：\n');
    oversizedFiles.forEach(({ file, sizeMB }) => {
      console.error(`- ${file} (${sizeMB} MB)`);
    });
    console.error(`\n⚠️ 每个文件大小必须小于 ${MAX_SIZE_MB} MB。\n`);
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
