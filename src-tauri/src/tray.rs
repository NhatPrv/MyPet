use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter,
};

/// Khởi tạo khay hệ thống (System Tray) cho MyPet trên Windows 11
pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let spawn_butterfly_i = MenuItem::with_id(
        app,
        "spawn_butterfly",
        "Spawn Butterfly 🦋",
        true,
        None::<&str>,
    )?;
    let test_notif_i = MenuItem::with_id(
        app,
        "test_notif",
        "Send Test Notification 🔔",
        true,
        None::<&str>,
    )?;
    let toggle_sleep_i = MenuItem::with_id(
        app,
        "toggle_sleep",
        "Sleep / Wake Up 💤",
        true,
        None::<&str>,
    )?;
    let reset_pos_i = MenuItem::with_id(
        app,
        "reset_pos",
        "Reset Position 📍",
        true,
        None::<&str>,
    )?;
    let quit_i = MenuItem::with_id(
        app,
        "quit",
        "Quit MyPet ❌",
        true,
        None::<&str>,
    )?;

    let menu = Menu::with_items(
        app,
        &[
            &spawn_butterfly_i,
            &test_notif_i,
            &toggle_sleep_i,
            &reset_pos_i,
            &quit_i,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("MyPet - Gugugaga")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "spawn_butterfly" => {
                let _ = app.emit("tray-spawn-butterfly", ());
            }
            "test_notif" => {
                let _ = app.emit("tray-test-notification", ());
            }
            "toggle_sleep" => {
                let _ = app.emit("tray-toggle-sleep", ());
            }
            "reset_pos" => {
                let _ = app.emit("tray-reset-position", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
