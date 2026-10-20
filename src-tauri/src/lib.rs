mod notifications;
mod tray;
mod window_ext;

use window_ext::CursorTrackerState;

pub fn run() {
    tauri::Builder::default()
        .manage(CursorTrackerState::default())
        .setup(|app| {
            #[cfg(desktop)]
            {
                tray::setup_tray(app.handle())?;
                notifications::setup_notifications(app.handle().clone())?;
                window_ext::setup_cursor_tracker(app.handle());
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_ext::set_ignore_cursor_events,
            window_ext::update_hitboxes,
            window_ext::set_drag_state,
            notifications::trigger_custom_notification,
            notifications::request_notification_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running mypet application");
}
