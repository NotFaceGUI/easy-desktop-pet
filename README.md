# Easy Desktop Pet

一个基于 `Vue 3 + Tauri 2` 的透明桌宠项目。  
当前版本支持导入透明 `GIF / APNG / WebM` 素材，把宠物常驻显示在桌面上，并提供一个和宠物联动的简洁监督任务倒计时。

A transparent desktop pet built with `Vue 3 + Tauri 2`.  
It supports transparent `GIF / APNG / WebM` assets, keeps the pet floating on the desktop, and includes a lightweight task supervision countdown.

## 当前功能

- 透明桌宠窗口：无边框、透明背景、始终置顶、跳过任务栏
- 透明区域穿透，仅宠物和交互控件可点击
- 鼠标左键拖拽宠物移动窗口位置，并自动记忆
- 右键打开桌宠动作菜单
- 设置窗口支持：
  - 默认动作
  - 缩放比例
  - 开机启动
  - 自定义动作
  - 动作与素材映射
  - 素材导入与素材库查看
- 托盘支持：
  - 显示/隐藏宠物
  - 打开设置
  - 开始/暂停/重置监督任务
  - 切换开机启动
  - 检查更新
  - 退出
- 内置一套默认猫咪素材与应用图标

## 媒体支持

支持：

- `GIF`
- `APNG`
- 透明 `WebM`

说明：

- `GIF / APNG` 是跨平台最稳的方案
- 透明 `WebM` 依赖系统 WebView 能力，不同平台兼容性可能不同
- 当前不支持普通视频自动抠像、绿幕抠像或 AI 去背景

## 监督任务

项目当前不是经典三阶段番茄钟，而是更轻量的“监督任务”模式：

- 输入一件要做的事情
- 输入倒计时分钟数
- 点击开始后，宠物进入监督动作
- 倒计时结束后，自动切换到完成动作；若未配置完成动作，则回退默认动作

## 技术栈

- Vue 3
- TypeScript
- Pinia
- Element Plus
- Tauri 2

## 本地开发

```bash
pnpm install
pnpm tauri dev
```

常用命令：

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## 项目结构

```text
src/
  views/
    PetView.vue
    SettingsView.vue
  components/
  stores/
  lib/
src-tauri/
  src/lib.rs
  tauri.conf.json
  capabilities/default.json
  icons/
public/assets/
  cat-idle.gif
```

## 图标

当前项目图标源文件：

```text
src-tauri/app-icon.svg
```

生成整套平台图标：

```bash
pnpm tauri icon src-tauri/app-icon.svg -o src-tauri/icons
```

## 开机启动

开机启动通过 `@tauri-apps/plugin-autostart` 实现，可在设置页或托盘中切换。

## 自动更新

项目已接入 Tauri updater。  
对普通使用者来说无需额外操作；对仓库维护者来说，需要在发布环境中配置 updater 签名密钥后，GitHub Release 才能生成可用于自动更新的发布制品。

## 发布

本地打包：

```bash
pnpm tauri build
```

## CI / Release

项目包含两条 GitHub Actions 工作流：

- `ci.yml`
  - 在推送到 `main` 或 PR 时运行
  - 执行依赖安装、类型检查、Lint、测试、前端构建、Rust 检查

- `release.yml`
  - 在推送 `v*` tag 或手动触发时运行
  - 构建 Windows / macOS / Linux 安装包
  - 上传到 GitHub Releases
  - 生成 updater 所需发布制品
