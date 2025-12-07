// Firebase 配置验证脚本
// 运行: node verify-firebase.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 .env.local 文件
let envContent = '';
try {
  envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
} catch (error) {
  console.error('❌ 无法读取 .env.local 文件');
  console.error('请确保 .env.local 文件存在');
  process.exit(1);
}

// 解析环境变量
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// 必需的 Firebase 环境变量
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('🔍 检查 Firebase 配置...\n');

let allValid = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== 'your_api_key_here' && value !== '') {
    // 隐藏敏感信息，只显示前 10 个字符
    const displayValue = value.length > 10 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: 未设置或无效`);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('✅ 所有 Firebase 环境变量已正确配置！');
  console.log('\n📝 下一步：');
  console.log('1. 确保 Firebase 项目已创建');
  console.log('2. 确保 Firestore Database 已启用');
  console.log('3. 确保 Firebase Storage 已启用');
  console.log('4. 运行 npm run dev 启动应用');
  console.log('5. 检查浏览器控制台是否显示 "[Firebase] Initialized successfully"');
} else {
  console.log('❌ 部分环境变量未配置');
  console.log('\n📝 请按照以下步骤配置：');
  console.log('1. 访问 https://console.firebase.google.com/');
  console.log('2. 创建或选择项目');
  console.log('3. 添加 Web 应用并获取配置信息');
  console.log('4. 将配置信息添加到 .env.local 文件');
  console.log('5. 参考 FIREBASE_CONFIG_GUIDE.md 获取详细步骤');
}

console.log('\n');




