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

项目已经接入 Tauri updater，但要真正工作还需要两部分：

1. 在 `src-tauri/tauri.conf.json` 中填入 updater 公钥：

```json
"pubkey": "REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY"
```

2. 在 GitHub Actions Secrets 中配置：

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### pubkey 从哪里来

`pubkey` 不是随便写的，它来自你生成 updater 签名密钥对时的公钥。

如果你已经有另一个 Tauri 自动更新项目，并且想复用同一套签名体系：

- 直接取那个项目对应的 updater 公钥
- 同时把同一套私钥内容放到当前仓库的 `TAURI_SIGNING_PRIVATE_KEY`
- 私钥密码放到 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

如果你想新生成一套，通常用 Tauri signer 生成密钥对，然后：

- 私钥放 GitHub Secrets
- 公钥填进 `tauri.conf.json`

注意：公钥必须和发布时实际使用的私钥配套，否则更新检查和安装都会失败。

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

### 为什么没看到 release

只有满足下面条件时才会生成 Release：

- 已推送 `v*` tag，例如 `v0.1.0`
- `release.yml` 跑成功
- 仓库 Secrets 中的签名私钥配置正确

如果 tag 已推上去但 Release 还没出现，通常是：

- 工作流还在跑
- 工作流失败
- updater 签名相关 Secrets 没配

## 当前状态

- 当前主分支已经存在首个提交
- 已推送 `v0.1.0` tag
- Release 工作流已被触发
- Windows 是当前主要验收平台
