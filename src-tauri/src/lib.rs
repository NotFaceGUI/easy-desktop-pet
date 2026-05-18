use std::{
    fs,
    path::{Path, PathBuf},
};

use anyhow::{Context, Result};
use mime_guess::MimeGuess;
use serde::Serialize;
use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_autostart::Builder as AutostartBuilder;
use tauri_plugin_autostart::ManagerExt as _;
use tauri_plugin_updater::Builder as UpdaterBuilder;

const PET_WINDOW_LABEL: &str = "pet";
const SETTINGS_WINDOW_LABEL: &str = "settings";
const ASSET_DIR: &str = "assets";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PetAsset {
    id: String,
    name: String,
    kind: String,
    file_name: String,
    local_path: String,
    mime_type: String,
    is_bundled: bool,
}

#[derive(Debug, Clone, Serialize)]
struct ImportAssetsResult {
    imported: Vec<PetAsset>,
    skipped: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateInfo {
    current_version: String,
    version: String,
    body: Option<String>,
    date: Option<String>,
}

fn app_asset_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .context("failed to resolve app data dir")?
        .join(ASSET_DIR);
    fs::create_dir_all(&dir).context("failed to create asset dir")?;
    Ok(dir)
}

fn sanitize_name(name: &str) -> String {
    name.chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_lowercase()
}

fn asset_kind_from_ext(ext: &str) -> Option<&'static str> {
    match ext {
        "gif" => Some("gif"),
        "apng" => Some("apng"),
        "webm" => Some("webm"),
        _ => None,
    }
}

fn create_pet_asset(file_name: &str) -> Option<PetAsset> {
    let source_path = Path::new(file_name);
    let stem = source_path.file_stem()?.to_string_lossy().to_string();
    let ext = source_path.extension()?.to_string_lossy().to_ascii_lowercase();
    let kind = asset_kind_from_ext(&ext)?;
    let mime_type = MimeGuess::from_ext(&ext)
        .first_or_octet_stream()
        .essence_str()
        .to_string();

    Some(PetAsset {
        id: format!("asset-{}", sanitize_name(&format!("{stem}-{file_name}"))),
        name: stem,
        kind: kind.to_string(),
        file_name: file_name.to_string(),
        local_path: format!("{ASSET_DIR}/{file_name}"),
        mime_type,
        is_bundled: false,
    })
}

#[tauri::command]
fn import_assets(app: AppHandle, paths: Vec<String>) -> Result<ImportAssetsResult, String> {
    let asset_dir = app_asset_dir(&app).map_err(|err| err.to_string())?;
    let mut imported = Vec::new();
    let mut skipped = Vec::new();

    for path in paths {
      let source = PathBuf::from(&path);
      if !source.exists() {
          skipped.push(path);
          continue;
      }

      let ext = source
          .extension()
          .and_then(|value| value.to_str())
          .unwrap_or_default()
          .to_ascii_lowercase();
      if asset_kind_from_ext(&ext).is_none() {
          skipped.push(path);
          continue;
      }

      let stem = source
          .file_stem()
          .and_then(|value| value.to_str())
          .unwrap_or("asset");
      let file_name = format!("{}-{}.{}", sanitize_name(stem), uuid_like(), ext);
      let target = asset_dir.join(&file_name);

      if fs::copy(&source, &target).is_err() {
          skipped.push(path);
          continue;
      }

      if let Some(asset) = create_pet_asset(&file_name) {
          imported.push(asset);
      } else {
          skipped.push(path);
      }
    }

    Ok(ImportAssetsResult { imported, skipped })
}

#[tauri::command]
async fn open_settings(app: AppHandle) -> Result<(), String> {
    show_settings_window(&app).map_err(|err| err.to_string())
}

#[tauri::command]
fn reset_pet_position(app: AppHandle) -> Result<(), String> {
    let pet_window = app
        .get_webview_window(PET_WINDOW_LABEL)
        .ok_or_else(|| "pet window not found".to_string())?;
    pet_window
        .set_position(PhysicalPosition::new(80, 80))
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn check_for_updates(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    use tauri_plugin_updater::UpdaterExt;

    let updater = app.updater().map_err(|err| err.to_string())?;
    let update = updater.check().await.map_err(|err| err.to_string())?;

    Ok(update.map(|update| UpdateInfo {
        current_version: update.current_version.clone(),
        version: update.version.clone(),
        body: update.body.clone(),
        date: update.date.as_ref().map(|date| date.to_string()),
    }))
}

fn uuid_like() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    format!("{millis:x}")
}

fn show_settings_window(app: &AppHandle) -> Result<()> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        if window.is_minimized().unwrap_or(false) {
            let _ = window.unminimize();
        }
        window.show()?;
        let _ = window.set_focus();
        return Ok(());
    }

    let window = WebviewWindowBuilder::new(
        app,
        SETTINGS_WINDOW_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .initialization_script("window.location.hash = '/settings';")
    .title("桌宠设置")
    .center()
    .resizable(true)
    .inner_size(1080.0, 840.0)
    .build()?;

    let window_for_close = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window_for_close.hide();
        }
    });

    window.show()?;
    let _ = window.set_focus();

    Ok(())
}

fn create_pet_window(app: &AppHandle) -> Result<()> {
    if let Some(window) = app.get_webview_window(PET_WINDOW_LABEL) {
        window.show()?;
        return Ok(());
    }

    let pet_window = WebviewWindowBuilder::new(
        app,
        PET_WINDOW_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .initialization_script("if (!window.location.hash) window.location.hash = '/pet';")
    .title("Easy Desktop Pet")
    .transparent(true)
    .decorations(false)
    .shadow(false)
    .skip_taskbar(true)
    .always_on_top(true)
    .resizable(false)
    .visible(true)
    .focusable(true)
    .inner_size(500.0, 460.0)
    .build()?;

    pet_window.on_window_event(|event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
        }
    });

    Ok(())
}

fn toggle_pet_window(app: &AppHandle) -> Result<()> {
    if let Some(window) = app.get_webview_window(PET_WINDOW_LABEL) {
        if window.is_visible()? {
            window.hide()?;
        } else {
            window.show()?;
        }
        return Ok(());
    }

    create_pet_window(app)
}

fn emit_tray_action(app: &AppHandle, action: &str) {
    let _ = app.emit(
        "tray-action",
        serde_json::json!({
            "action": action,
        }),
    );
}

fn setup_tray(app: &AppHandle) -> Result<()> {
    let pet_visible = app
        .get_webview_window(PET_WINDOW_LABEL)
        .map(|window| window.is_visible().unwrap_or(true))
        .unwrap_or(true);
    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);

    let show_hide = CheckMenuItemBuilder::with_id("toggle-pet", "显示宠物")
        .checked(pet_visible)
        .build(app)?;
    let settings = MenuItem::with_id(app, "open-settings", "打开设置", true, None::<&str>)?;
    let start = MenuItem::with_id(app, "todo-start", "开始任务", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "todo-pause", "暂停任务", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "todo-reset", "重置任务", true, None::<&str>)?;
    let autostart = CheckMenuItemBuilder::with_id("toggle-autostart", "开机启动")
        .checked(autostart_enabled)
        .build(app)?;
    let update = MenuItem::with_id(app, "check-update", "检查更新", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = MenuBuilder::new(app)
        .item(&show_hide)
        .item(&settings)
        .separator()
        .item(&start)
        .item(&pause)
        .item(&reset)
        .separator()
        .item(&autostart)
        .item(&update)
        .separator()
        .item(&quit)
        .build()?;

    let icon = app.default_window_icon().cloned();
    let mut builder = TrayIconBuilder::with_id("main");
    if let Some(icon) = icon {
        builder = builder.icon(icon);
    }

    builder
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "open-settings" => {
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = show_settings_window(&handle);
                });
            }
            "toggle-autostart" => emit_tray_action(app, "toggle-autostart"),
            "check-update" => emit_tray_action(app, "check-update"),
            "toggle-pet" => {
                let _ = toggle_pet_window(app);
            }
            "todo-start" => emit_tray_action(app, "todo-start"),
            "todo-pause" => emit_tray_action(app, "todo-pause"),
            "todo-reset" => emit_tray_action(app, "todo-reset"),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            AutostartBuilder::new()
                .args(["--background"])
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(UpdaterBuilder::new().build())?;

            create_pet_window(&app.handle())?;
            setup_tray(&app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            import_assets,
            open_settings,
            reset_pet_position,
            check_for_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
