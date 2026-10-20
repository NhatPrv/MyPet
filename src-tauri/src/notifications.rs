use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NotificationPayload {
    pub id: String,
    pub app_name: String,
    pub title: String,
    pub body: String,
    pub timestamp: u64,
    pub priority: Option<String>,
}

/// Lệnh IPC kích hoạt thông báo kiểm thử hoặc thông báo tùy biến từ giao diện/tray
#[tauri::command]
pub async fn trigger_custom_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
    app_name: Option<String>,
) -> Result<(), String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let payload = NotificationPayload {
        id: format!("notif-{}", now),
        app_name: app_name.unwrap_or_else(|| "MyPet System".to_string()),
        title,
        body,
        timestamp: now,
        priority: Some("normal".to_string()),
    };

    app.emit("system-notification", &payload)
        .map_err(|e| format!("Failed to emit notification event: {e}"))
}

/// Yêu cầu quyền truy cập WinRT UserNotificationListener
#[tauri::command]
pub async fn request_notification_permission() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use windows::UI::Notifications::Management::{
            UserNotificationListener, UserNotificationListenerAccessStatus,
        };

        let listener = UserNotificationListener::Current()
            .map_err(|e| format!("Failed to get UserNotificationListener: {e}"))?;

        let access_op = listener
            .RequestAccessAsync()
            .map_err(|e| format!("RequestAccessAsync failed: {e}"))?;

        let status = access_op
            .get()
            .map_err(|e| format!("Failed to await access operation: {e}"))?;

        match status {
            UserNotificationListenerAccessStatus::Allowed => Ok("Allowed".to_string()),
            UserNotificationListenerAccessStatus::Denied => Ok("Denied".to_string()),
            UserNotificationListenerAccessStatus::Unspecified => Ok("Unspecified".to_string()),
            _ => Ok("Unknown".to_string()),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok("MockAllowed".to_string())
    }
}

/// Khởi tạo background task lắng nghe WinRT Toast Notifications trên Windows 11
pub fn setup_notifications(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        tauri::async_runtime::spawn(async move {
            use std::collections::HashSet;
            use std::time::Duration;
            use tokio::time::sleep;
            use windows::UI::Notifications::Management::UserNotificationListener;
            use windows::UI::Notifications::NotificationKinds;

            let listener_res = UserNotificationListener::Current();
            if let Ok(listener) = listener_res {
                // Kiểm tra trạng thái truy cập
                let access = listener.GetAccessStatus();
                if let Ok(status) = access {
                    eprintln!("[MyPet WinRT] Notification listener status: {:?}", status);
                }

                let mut seen_ids: HashSet<u32> = HashSet::new();

                // Polling loop định kỳ kiểm tra thông báo mới
                loop {
                    sleep(Duration::from_millis(1500)).await;

                    if let Ok(notifs_op) = listener.GetNotificationsAsync(NotificationKinds::Toast) {
                        if let Ok(notifications) = notifs_op.get() {
                            if let Ok(size) = notifications.Size() {
                                for i in 0..size {
                                    if let Ok(user_notif) = notifications.GetAt(i) {
                                        if let Ok(id) = user_notif.Id() {
                                            if !seen_ids.contains(&id) {
                                                seen_ids.insert(id);

                                                // Giới hạn kích thước tập seen_ids để tránh rò rỉ bộ nhớ
                                                if seen_ids.len() > 1000 {
                                                    seen_ids.clear();
                                                    seen_ids.insert(id);
                                                }

                                                let app_name = user_notif
                                                    .AppInfo()
                                                    .and_then(|info| info.DisplayInfo())
                                                    .and_then(|d| d.DisplayName())
                                                    .map(|h| h.to_string())
                                                    .unwrap_or_else(|_| "Ứng dụng".to_string());

                                                let mut title = "Thông báo mới".to_string();
                                                let mut body = String::new();

                                                if let Ok(notification) = user_notif.Notification() {
                                                    if let Ok(visual) = notification.Visual() {
                                                        if let Ok(bindings) = visual.Bindings() {
                                                            if let Ok(b_size) = bindings.Size() {
                                                                for b_idx in 0..b_size {
                                                                    if let Ok(binding) = bindings.GetAt(b_idx) {
                                                                        if let Ok(texts) = binding.GetTextElements() {
                                                                            if let Ok(t_size) = texts.Size() {
                                                                                if t_size > 0 {
                                                                                    if let Ok(t_elem) = texts.GetAt(0) {
                                                                                        if let Ok(text) = t_elem.Text() {
                                                                                            title = text.to_string();
                                                                                        }
                                                                                    }
                                                                                }
                                                                                if t_size > 1 {
                                                                                    if let Ok(t_elem) = texts.GetAt(1) {
                                                                                        if let Ok(text) = t_elem.Text() {
                                                                                            body = text.to_string();
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }

                                                let now = SystemTime::now()
                                                    .duration_since(UNIX_EPOCH)
                                                    .unwrap_or_default()
                                                    .as_millis() as u64;

                                                let payload = NotificationPayload {
                                                    id: id.to_string(),
                                                    app_name,
                                                    title,
                                                    body,
                                                    timestamp: now,
                                                    priority: Some("normal".to_string()),
                                                };

                                                let _ = app_handle.emit("system-notification", &payload);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                eprintln!("[MyPet WinRT] UserNotificationListener is not available in current context.");
            }
        });
    }

    Ok(())
}
