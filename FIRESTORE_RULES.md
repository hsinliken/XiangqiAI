# Firestore 安全规则配置

## 🔧 修复权限错误

如果看到 `Missing or insufficient permissions` 错误，请按照以下步骤更新 Firestore 安全规则。

## 📝 步骤 1: 打开 Firestore 规则编辑器

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择您的项目 `xiangqiai-ce5d2`
3. 在左侧菜单点击「Firestore Database」
4. 点击「规则」标签

## 📝 步骤 2: 复制并粘贴以下规则

将以下规则**完全替换**现有的规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允许访问所有文档（开发模式）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 📝 步骤 3: 发布规则

1. 点击「发布」按钮
2. 等待规则发布完成（通常几秒钟）
3. 应该看到「规则已发布」的确认消息

## ✅ 验证

1. 刷新您的应用页面
2. 打开浏览器控制台（F12）
3. 应该不再看到权限错误
4. 应该看到 `[Firebase] System prompt saved` 或类似的成功消息

## 🔒 生产环境规则（可选）

如果您想为生产环境配置更安全的规则，可以使用以下规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 卜卦结果集合 - 允许所有人读取，但只有认证用户可写入
    match /divination_results/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 系统设置集合 - 允许所有人读取，但只有认证用户可写入
    match /system_settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 其他所有文档 - 默认拒绝
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**注意**：生产环境规则需要启用 Firebase Authentication。开发阶段建议使用测试模式规则。

## 🐛 常见问题

### 问题 1: 规则发布后仍然报错
**解决方法**：
- 等待 1-2 分钟让规则生效
- 刷新浏览器页面
- 清除浏览器缓存

### 问题 2: 规则编辑器显示语法错误
**解决方法**：
- 检查是否完全复制了规则代码
- 确保没有额外的空格或字符
- 检查 JavaScript 语法是否正确

### 问题 3: 仍然无法访问
**解决方法**：
- 确认规则已成功发布
- 检查 Firebase 项目是否正确
- 检查环境变量中的项目 ID 是否正确





