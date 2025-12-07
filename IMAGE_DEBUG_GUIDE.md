# 九宫图图片保存问题诊断指南

## 🔍 问题：记录档中卦象栏没有显示图片

如果记录档中的卦象栏显示 `-` 而不是图片，请按照以下步骤诊断：

## 📝 步骤 1: 检查浏览器控制台日志

打开浏览器开发者工具（F12），查看 Console 标签，应该看到以下日志：

### ✅ 正常流程应该看到：

1. **图片捕获阶段**：
   ```
   [Image Capture] ✅ Element found, starting capture...
   [Image Capture] ✅ Successfully captured image, size: XXXXX characters
   ```

2. **图片上传阶段**：
   ```
   [Firebase] Attempting to upload image for ...
   [Firebase Storage] Image uploaded: https://...
   [Firebase] Image uploaded successfully, URL: https://...
   ```

3. **数据保存阶段**：
   ```
   [Firebase] Adding layout_image to record: https://...
   [Firebase] ✅ Result saved for ... with image URL: https://...
   ```

### ❌ 如果看到错误：

- `[Image Capture] ❌ Element with id "layout-slots-capture" not found`
  - **原因**：九宫图元素未找到
  - **解决**：检查 `LayoutSlots` 组件是否正确渲染

- `[Image Capture] ❌ html2canvas is not available`
  - **原因**：html2canvas 库未加载
  - **解决**：检查 `index.html` 中是否包含 html2canvas 脚本

- `[Firebase Storage] 权限被拒绝`
  - **原因**：Storage 安全规则未配置
  - **解决**：参考 `FIRESTORE_RULES.md` 配置 Storage 规则

- `[Firebase] Failed to upload image`
  - **原因**：图片上传失败
  - **解决**：检查网络连接和 Storage 配置

## 📝 步骤 2: 检查 Firebase Storage

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目 `xiangqiai-ce5d2`
3. 点击「Storage」
4. 检查是否有 `divination_images` 文件夹
5. 检查文件夹中是否有图片文件

**如果没有图片**：
- 说明图片上传失败
- 检查控制台错误信息
- 检查 Storage 安全规则

## 📝 步骤 3: 检查 Firestore 数据

1. 在 Firebase Console 中，点击「Firestore Database」
2. 打开 `divination_results` 集合
3. 选择一个记录
4. 检查是否有 `layout_image` 字段
5. 如果有，检查值是否为有效的 URL

**如果没有 `layout_image` 字段**：
- 说明图片 URL 未保存
- 检查控制台是否有错误

**如果 `layout_image` 是空字符串或 null**：
- 说明图片上传失败
- 检查 Storage 配置

## 📝 步骤 4: 检查 Storage 安全规则

1. 在 Firebase Console 中，点击「Storage」
2. 点击「规则」标签
3. 确保规则允许读写：

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

4. 点击「发布」

## 📝 步骤 5: 手动测试图片捕获

在浏览器控制台中运行：

```javascript
// 检查元素是否存在
const element = document.getElementById('layout-slots-capture');
console.log('Element found:', !!element);
console.log('Element visible:', element?.offsetParent !== null);

// 检查 html2canvas
console.log('html2canvas available:', !!window.html2canvas);
```

## 🔧 常见问题解决

### 问题 1: 图片捕获失败
**症状**：控制台显示 `Element not found`

**解决方法**：
1. 确保在 `handleCategorySelect` 调用时，九宫图已经渲染
2. 检查 `LayoutSlots` 组件的 `id` 是否为 `layout-slots-capture`
3. 增加延迟时间（当前是 200ms）

### 问题 2: 图片上传失败
**症状**：控制台显示 `Failed to upload image`

**解决方法**：
1. 检查 Storage 是否已启用
2. 检查 Storage 安全规则
3. 检查网络连接
4. 检查 Firebase 配置是否正确

### 问题 3: 图片 URL 未保存
**症状**：Storage 有图片，但 Firestore 没有 `layout_image` 字段

**解决方法**：
1. 检查 Firestore 安全规则
2. 检查控制台是否有保存错误
3. 检查图片 URL 是否有效

### 问题 4: 缓存记录没有图片
**症状**：新记录有图片，但缓存记录没有

**解决方法**：
- 代码已修复，缓存更新后会重新获取记录
- 如果仍有问题，清除缓存或删除旧记录

## 📊 调试检查清单

- [ ] 浏览器控制台没有错误
- [ ] 图片捕获成功（看到 `Successfully captured image`）
- [ ] 图片上传成功（看到 `Image uploaded successfully`）
- [ ] Firestore 记录有 `layout_image` 字段
- [ ] `layout_image` 字段值是有效的 URL
- [ ] Storage 中有对应的图片文件
- [ ] Storage 安全规则允许读写
- [ ] Firestore 安全规则允许读写

## 🆘 仍然无法解决？

如果按照以上步骤仍无法解决问题，请提供：
1. 浏览器控制台的完整日志
2. Firebase Console 中 Storage 的截图
3. Firebase Console 中 Firestore 记录的截图
4. 具体的错误信息





