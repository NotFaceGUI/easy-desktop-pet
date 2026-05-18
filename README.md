# Easy Desktop Pet

透明桌面宠物，支持导入透明 `GIF / APNG / WebM` 素材，在桌面上常驻播放，并附带一个和宠物联动的简易番茄时钟。

Transparent desktop pet built with `Vue 3 + Tauri 2`. It plays transparent `GIF / APNG / WebM` assets on the desktop and includes a pomodoro timer that can switch pet actions by stage.

## Features

- 透明桌宠窗口：无边框、透明背景、始终置顶、跳过任务栏
- 双窗口结构：`pet` 运行窗口 + `settings` 设置窗口
- 素材导入：支持导入透明 `GIF / APNG / WebM`
- 动作映射：一个动作可绑定多个动画，随机播放
- 默认猫咪：仓库内置一个透明猫咪待机动画
- 番茄时钟：专注 / 短休 / 长休阶段驱动宠物动作切换
- 系统托盘：显示隐藏、打开设置、番茄控制、更新检查、退出
- 开机启动：基于 Tauri autostart 插件
- 自动更新预留：基于 GitHub Releases + updater

## Media Support

首版不支持普通视频自动去背景，也不做绿幕抠像。

Supported:

- `GIF`
- `APNG`
- transparent `WebM` as enhanced support

Notes:

- `GIF / APNG` 是跨平台保底方案
- 透明 `WebM` 依赖平台 WebView 能力，不同系统可能存在兼容差异

## Tech Stack

- Vue 3
- TypeScript
- Pinia
- Element Plus
- Tauri 2

## Development

```bash
pnpm install
pnpm tauri dev
```

Useful commands:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Project Structure

```text
src/
  views/
    PetView.vue
    SettingsView.vue
  stores/
    app.ts
  lib/
src-tauri/
  src/lib.rs
  tauri.conf.json
  capabilities/default.json
public/assets/
  cat-idle.gif
```

## Auto Start

开机启动通过 `@tauri-apps/plugin-autostart` 实现，可在设置页或托盘中切换。

## Auto Update

项目已经预留 updater 配置，发布到 GitHub Releases 时需要设置：

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

还需要把 `src-tauri/tauri.conf.json` 里的：

```json
"pubkey": "REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY"
```

替换成你自己的 updater 公钥。

## Release

本地调试打包：

```bash
cargo tauri build --debug
```

正式签名发布：

```bash
pnpm tauri build
```

## CI / CD

仓库包含两条工作流：

- `ci.yml`: 安装依赖、类型检查、Lint、单测、前端构建、Rust 检查
- `release.yml`: 打 tag 或手动触发时构建桌面安装包并上传到 GitHub Releases

## Current Notes

- Windows 是首要验证平台
- `cargo tauri build --debug` 已可生成安装包
- 若未配置签名私钥，updater 制品不会完成签名
- 当前 `eslint` 仍保留一批 Vue 模板格式 warning，不影响构建和测试

