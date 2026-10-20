use tauri::WebviewWindow;

/// Lệnh IPC thiết lập trạng thái xuyên chuột (click-through) cho cửa sổ trong suốt.
/// Khi ignore = true: Chuột click xuyên qua cửa sổ tới ứng dụng bên dưới.
/// Khi ignore = false: Cửa sổ nhận tương tác chuột bình thường (hitbox Pet).
#[tauri::command]
pub async fn set_ignore_cursor_events(
    window: WebviewWindow,
    ignore: bool,
) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| format!("Failed to set ignore cursor events: {e}"))
}
