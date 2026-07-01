# 构建 .ipa 安装包指南

## 先看清楚：你到底需要什么？

| 构建方式 | 需要自己的 Mac？ | 需要 Apple 开发者账号？ | 安装到 iPhone 有效期 | 适合 |
|----------|:---------------:|:--------------------:|:-----------------:|------|
| **选项 A** — 本地 Xcode | ✅ 必须 | 免费即可 | 7 天（免费）/ 1 年（付费） | 有 Mac 的开发者 |
| **选项 B** — GitHub Actions | ❌ 不需要 | 免费即可 | 7 天（免费）/ 1 年（付费） | 没有 Mac、想试 .ipa |
| **选项 C** — PWA | ❌ 不需要 | ❌ 不需要 | **永久** | **个人使用首选** ✅ |

> **对于你自己的 iPhone 14 Pro Max：选项 C（PWA）是最省事的**——不需要 Mac、不要 Apple 账号、不会过期、功能完全一样（含语音）。

---

## 选项 A：自己的 Mac + Xcode

```bash
cd interview-helper-ios/frontend
npm install @capacitor/cli @capacitor/core @capacitor/ios
npm run build
npx cap init "CS面试助手" "com.csinterview.helper" --web-dir=../backend/static
npx cap add ios
npx cap open ios
```

然后在 Xcode 中：**Product → Archive → Distribute App → 导出 .ipa**

---

## 选项 B：GitHub Actions（云端 Mac，不需要自己的 Mac）

**原理：** GitHub 提供 `macos-15` 云虚拟机帮你编译。你的代码推到 GitHub，GitHub 的 Mac 服务器编译出 `.ipa`，你下载到 Windows 电脑，再用工具装到 iPhone。

**你需要准备：**
1. GitHub 账号 + 把项目推到一个**公开仓库**（公开仓库 macOS runner 免费）
2. Apple Developer 账号（免费即可，[developer.apple.com](https://developer.apple.com) 注册）
3. 在 Apple Developer 后台生成代码签名证书，存到 GitHub Secrets

### 步骤

**1. 创建 `.github/workflows/build-ios.yml`：**

```yaml
name: Build iOS IPA
on: workflow_dispatch  # 手动触发

jobs:
  build:
    runs-on: macos-15      # ← GitHub 的云端 Mac，不需要你自己的 Mac
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build Frontend
        working-directory: frontend
        run: |
          npm install
          npm run build

      - name: Setup Capacitor
        working-directory: frontend
        run: |
          npm install @capacitor/cli @capacitor/core @capacitor/ios
          npx cap init "CS面试助手" "com.csinterview.helper" --web-dir=../backend/static
          npx cap add ios

      - name: Import Code Signing Certificate
        uses: apple-actions/import-codesign-certs@v3
        with:
          p12-file-base64: ${{ secrets.IOS_DISTRIBUTION_CERT }}
          p12-password: ${{ secrets.IOS_DISTRIBUTION_CERT_PASSWORD }}

      - name: Build IPA
        run: |
          cd frontend/ios
          xcodebuild -workspace App.xcworkspace \
            -scheme App -sdk iphoneos -configuration Release \
            -archivePath build/App.xcarchive archive
          xcodebuild -exportArchive \
            -archivePath build/App.xcarchive \
            -exportPath build \
            -exportOptionsPlist exportOptions.plist

      - name: Upload IPA
        uses: actions/upload-artifact@v4
        with:
          name: CS面试助手.ipa
          path: frontend/ios/build/*.ipa
```

**2. 推送到 GitHub → Actions 标签页 → 手动触发 → 等 ~10 分钟 → 下载 `.ipa`**

**3. 安装到 iPhone：** 用 [AltStore](https://altstore.io)、Sideloadly 或 Apple Configurator 把 `.ipa` 装到手机。

> ⚠️ 免费 Apple 账号签名的 `.ipa` **7 天后过期**，需要重新签名安装。付费账号 ($99/年) 无此限制。

---

## 选项 C：PWA — 最简方式，推荐个人使用

**不需要 Mac、不需要 Apple 账号、不会过期、功能完全一样。**

### 操作步骤（1 分钟）

1. 双击 `start-preview.bat` 启动服务
2. **iPhone Safari** 打开 `http://<你电脑的IP>:8000`
3. 点 Safari 底部 **「分享」** 按钮
4. 选择 **「添加到主屏幕」**
5. 命名 → 点「添加」

完成。主屏幕上出现独立图标，点开就是全屏 App。

| 功能 | PWA | 原生 .ipa |
|------|:---:|:--------:|
| 全屏运行 | ✅ | ✅ |
| 主屏幕图标 | ✅ | ✅ |
| 所有面试功能 | ✅ | ✅ |
| 语音输入/播报 | ✅ | ✅ |
| 暗色模式 | ✅ | ✅ |
| 离线缓存 | ✅ | ✅ |
| App Store 分发 | ❌ | ✅ |
| 推送通知 | ❌ | ✅ |
| 7 天过期 | ❌ 永不 | ⚠️ 免费证书 7 天 |

---

## 签名证书

构建 .ipa 需要 Apple Developer 账号：
- **免费账号**：只能装到自己注册过的设备，7 天过期，需重签
- **付费账号 ($99/年)**：可 TestFlight 分发，1 年有效
