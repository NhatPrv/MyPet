use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, WebviewWindow};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HitboxDef {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

pub struct CursorTrackerState {
    pub hitboxes: Arc<Mutex<Vec<HitboxDef>>>,
    pub is_dragging: Arc<AtomicBool>,
    pub is_ignoring: Arc<AtomicBool>,
}

impl Default for CursorTrackerState {
    fn default() -> Self {
        Self {
            hitboxes: Arc::new(Mutex::new(Vec::new())),
            is_dragging: Arc::new(AtomicBool::new(false)),
            is_ignoring: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// Lệnh IPC thiết lập trạng thái xuyên chuột trực tiếp từ frontend
#[tauri::command]
pub async fn set_ignore_cursor_events(
    window: WebviewWindow,
    ignore: bool,
) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| format!("Failed to set ignore cursor events: {e}"))
}

/// Lệnh IPC cập nhật danh sách hitbox (bounding box) từ frontend sang backend
#[tauri::command]
pub async fn update_hitboxes(
    state: tauri::State<'_, CursorTrackerState>,
    hitboxes: Vec<HitboxDef>,
) -> Result<(), String> {
    if let Ok(mut lock) = state.hitboxes.lock() {
        *lock = hitboxes;
    }
    Ok(())
}

/// Lệnh IPC thông báo trạng thái kéo thả chuột (đang drag hay đã thả)
#[tauri::command]
pub async fn set_drag_state(
    state: tauri::State<'_, CursorTrackerState>,
    is_dragging: bool,
) -> Result<(), String> {
    state.is_dragging.store(is_dragging, Ordering::SeqCst);
    Ok(())
}

/// Khởi tạo background task native theo dõi chuột toàn cục Windows 11 bằng GetCursorPos
pub fn setup_cursor_tracker(app: &AppHandle) {
    #[cfg(target_os = "windows")]
    {
        use std::time::Duration;
        use tokio::time::sleep;
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

        let app_handle = app.clone();

        tauri::async_runtime::spawn(async move {
            let padding = 16.0; // Vùng đệm 16px quanh hitbox để bắt chuột nhạy

            loop {
                sleep(Duration::from_millis(16)).await; // 60 FPS polling

                if let Some(state) = app_handle.try_state::<CursorTrackerState>() {
                    let is_dragging = state.is_dragging.load(Ordering::SeqCst);

                    let mut cursor_pt = POINT { x: 0, y: 0 };
                    let got_pos = unsafe { GetCursorPos(&mut cursor_pt).is_ok() };

                    let mut inside = is_dragging;

                    if got_pos && !is_dragging {
                        let cx = cursor_pt.x as f64;
                        let cy = cursor_pt.y as f64;

                        if let Ok(hitboxes) = state.hitboxes.lock() {
                            for h in hitboxes.iter() {
                                if cx >= (h.x - padding)
                                    && cx <= (h.x + h.width + padding)
                                    && cy >= (h.y - padding)
                                    && cy <= (h.y + h.height + padding)
                                {
                                    inside = true;
                                    break;
                                }
                            }
                        }
                    }

                    let currently_ignoring = state.is_ignoring.load(Ordering::SeqCst);

                    if inside && currently_ignoring {
                        // Chuột di chuyển vào thân pet -> Tắt cờ xuyên chuột để nhận tương tác
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_ignore_cursor_events(false);
                            state.is_ignoring.store(false, Ordering::SeqCst);
                        }
                    } else if !inside && !currently_ignoring {
                        // Chuột ra ngoài khoảng trống -> Kích hoạt xuyên chuột để click ứng dụng bên dưới
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_ignore_cursor_events(true);
                            state.is_ignoring.store(true, Ordering::SeqCst);
                        }
                    }
                }
            }
        });
    }
}
