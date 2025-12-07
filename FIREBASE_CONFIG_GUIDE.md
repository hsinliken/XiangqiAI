# Firebase 配置完整指南

## 📋 步骤 1: 创建 Firebase 项目

### 1.1 访问 Firebase Console
打开浏览器，访问：https://console.firebase.google.com/

### 1.2 创建新项目
1. 点击「创建项目」或「Add project」
2. **项目名称**：输入 `xiangqiai-ce5d2`（或您喜欢的名称）
3. 点击「继续」
4. **Google Analytics**：可以选择启用或禁用（建议先禁用，简化设置）
5. 点击「创建项目」
6. 等待项目创建完成（约 30 秒）

---

## 🔥 步骤 2: 启用 Firestore Database

### 2.1 进入 Firestore
1. 在 Firebase Console 左侧菜单，点击「Firestore Database」
2. 如果看到「创建数据库」按钮，点击它

### 2.2 配置数据库
1. **模式选择**：选择「以测试模式启动」
   - ⚠️ **注意**：测试模式允许所有读写，仅用于开发
   - 生产环境需要配置安全规则
2. **位置选择**：选择数据库位置
   - 推荐：`asia-east1`（台湾/香港）或 `asia-southeast1`（新加坡）
   - 点击「启用」
3. 等待数据库创建（约 1-2 分钟）

### 2.3 配置安全规则（开发阶段）
1. 在 Firestore Database 页面，点击「规则」标签
2. 复制以下规则并粘贴：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. 点击「发布」

---

## 📦 步骤 3: 启用 Firebase Storage

### 3.1 进入 Storage
1. 在 Firebase Console 左侧菜单，点击「Storage」
2. 如果看到「开始使用」按钮，点击它

### 3.2 配置 Storage
1. **模式选择**：选择「以测试模式启动」
2. **位置选择**：选择与 Firestore 相同的位置
3. 点击「完成」
4. 等待 Storage 创建（约 1 分钟）

### 3.3 配置 Storage 安全规则
1. 在 Storage 页面，点击「规则」标签
2. 复制以下规则并粘贴：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. 点击「发布」

---

## 🌐 步骤 4: 添加 Web 应用

### 4.1 添加应用
1. 在 Firebase Console 项目概览页面（齿轮图标旁边）
2. 点击「</>」图标（Web 应用图标）
3. **应用昵称**：输入 `xiangqi-web` 或任何名称
4. **Firebase Hosting**：可以取消勾选（暂时不需要）
5. 点击「注册应用」

### 4.2 获取配置信息
1. 复制显示的 `firebaseConfig` 对象
2. 它应该类似这样：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## ⚙️ 步骤 5: 配置环境变量

### 5.1 检查当前配置
您的 `.env.local` 文件应该包含以下内容：

```env
# Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAP2TtVHYGj5KD_HLgPRt2z85IXuVoiOzM
VITE_FIREBASE_AUTH_DOMAIN=xiangqiai-ce5d2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xiangqiai-ce5d2
VITE_FIREBASE_STORAGE_BUCKET=xiangqiai-ce5d2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=974957663870
VITE_FIREBASE_APP_ID=1:974957663870:web:710288f63c0fa4bf7baa2f
```

### 5.2 验证配置
确保所有 Firebase 环境变量都已正确设置：
- ✅ `VITE_FIREBASE_API_KEY` - API 密钥
- ✅ `VITE_FIREBASE_AUTH_DOMAIN` - 认证域名
- ✅ `VITE_FIREBASE_PROJECT_ID` - 项目 ID
- ✅ `VITE_FIREBASE_STORAGE_BUCKET` - Storage 存储桶
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID` - 消息发送者 ID
- ✅ `VITE_FIREBASE_APP_ID` - 应用 ID

---

## ✅ 步骤 6: 验证配置

### 6.1 重启开发服务器
```bash
# 停止当前服务器（Ctrl+C）
npm run dev
```

### 6.2 检查浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 应该看到：
   - ✅ `[Firebase] Initialized successfully` - 表示 Firebase 初始化成功
   - ❌ 如果看到 `[Firebase] Firebase not configured` - 检查环境变量

### 6.3 测试功能
1. 进行一次卜卦操作
2. 选择类别并等待分析完成
3. 检查控制台日志：
   - `[Firebase] Result saved for ...` - 数据已保存
   - `[Firebase Storage] Image uploaded: ...` - 图片已上传

### 6.4 验证数据库
1. 在 Firebase Console 中，打开「Firestore Database」
2. 应该能看到 `divination_results` 集合
3. 点击集合，应该能看到保存的记录

### 6.5 验证 Storage
1. 在 Firebase Console 中，打开「Storage」
2. 应该能看到 `divination_images` 文件夹
3. 点击文件夹，应该能看到上传的图片

---

## 🔧 常见问题排查

### 问题 1: Firebase 未初始化
**症状**：控制台显示 `[Firebase] Firebase not configured`

**解决方法**：
1. 检查 `.env.local` 文件是否存在
2. 确认所有 `VITE_FIREBASE_*` 变量都已设置
3. 重启开发服务器

### 问题 2: 权限被拒绝
**症状**：控制台显示 `permission-denied` 错误

**解决方法**：
1. 检查 Firestore 安全规则是否为测试模式
2. 检查 Storage 安全规则是否为测试模式
3. 确保规则已发布

### 问题 3: 图片上传失败
**症状**：记录保存成功但图片显示为 `-`

**解决方法**：
1. 检查 Storage 是否已启用
2. 检查 Storage 安全规则
3. 查看控制台错误信息

### 问题 4: 数据未保存
**症状**：操作后 Firestore 中没有记录

**解决方法**：
1. 检查网络连接
2. 检查浏览器控制台错误
3. 确认 Firestore 已启用并配置正确

---

## 📝 下一步

配置完成后，您可以：
1. ✅ 进行卜卦操作，数据会自动保存到 Firestore
2. ✅ 九宫图会自动上传到 Firebase Storage
3. ✅ 在后台管理界面查看所有记录
4. ✅ 图片会显示在记录列表中

---

## 🔒 生产环境注意事项

**⚠️ 重要**：当前使用的是测试模式安全规则，允许所有人读写数据。

部署到生产环境前，请务必：
1. 配置适当的安全规则
2. 启用 Firebase Authentication
3. 限制读写权限
4. 参考 `FIREBASE_SETUP.md` 中的生产环境规则示例





