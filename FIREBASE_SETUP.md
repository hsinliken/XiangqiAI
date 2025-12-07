# Firebase 设置指南

## 步骤 1: 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击「创建项目」或「Add project」
3. 输入项目名称（例如：`xiangqi-divination-ai`）
4. 选择是否启用 Google Analytics（可选）
5. 点击「创建项目」

## 步骤 2: 启用 Firestore Database

1. 在 Firebase Console 中，点击左侧菜单的「Firestore Database」
2. 点击「创建数据库」
3. 选择「以测试模式启动」（开发阶段）
   - 注意：测试模式允许所有读写操作，仅用于开发
   - 生产环境需要配置安全规则
4. 选择数据库位置（建议选择离用户最近的区域，如 `asia-east1`）
5. 点击「启用」

### 安全规则（开发模式）

在 Firestore Database > 规则 中，开发阶段可以使用：

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

**⚠️ 警告：** 这个规则允许任何人读写数据，仅用于开发测试！

## 步骤 3: 启用 Firebase Storage

1. 在 Firebase Console 中，点击左侧菜单的「Storage」
2. 点击「开始使用」
3. 选择「以测试模式启动」
4. 选择存储位置（建议与 Firestore 相同）
5. 点击「完成」

### Storage 安全规则（开发模式）

在 Storage > 规则 中，开发阶段可以使用：

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

## 步骤 4: 添加 Web 应用

1. 在 Firebase Console 项目概览页面，点击「</>」图标（Web 应用）
2. 输入应用昵称（例如：`xiangqi-web`）
3. 勾选「也设置 Firebase Hosting」（可选）
4. 点击「注册应用」
5. 复制显示的配置信息（firebaseConfig）

## 步骤 5: 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件：

```env
# Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

将复制的 `firebaseConfig` 中的值填入对应的环境变量。

## 步骤 6: 重启开发服务器

```bash
npm run dev
```

## 验证设置

1. 打开浏览器控制台
2. 应该看到 `[Firebase] Initialized successfully` 消息
3. 进行一次卜卦操作
4. 在 Firebase Console > Firestore Database 中应该能看到 `divination_results` 集合
5. 在 Firebase Console > Storage 中应该能看到 `divination_images` 文件夹

## 注意事项

- **Firestore 会自动创建集合**：第一次写入数据时，Firestore 会自动创建集合和文档，无需手动创建
- **Storage 会自动创建文件夹**：第一次上传图片时，Storage 会自动创建文件夹结构
- **如果 Firebase 未配置**：应用会自动回退到 localStorage，不会报错
- **生产环境安全规则**：部署到生产环境前，务必配置适当的安全规则

## 生产环境安全规则示例

### Firestore 规则（仅允许认证用户）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /divination_results/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /system_settings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == 'admin-uid';
    }
  }
}
```

### Storage 规则（仅允许认证用户）

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /divination_images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

