mod notifications;
mod tray;
mod window_ext;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                tray::setup_tray(app.handle())?;
                notifications::setup_notifications(app.handle().clone())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_ext::set_ignore_cursor_events,
            notifications::trigger_custom_notification,
            notifications::request_notification_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running mypet application");
}
