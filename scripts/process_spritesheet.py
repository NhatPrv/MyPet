import os
from PIL import Image

sheet_path = r"public/assets/gugugaga_sheet.png"
out_path = r"public/assets/gugugaga_spritesheet.png"

img = Image.open(out_path).convert("RGBA")

def get_bbox(x1, y1, x2, y2):
    cropped = img.crop((x1, y1, x2, y2))
    bbox = cropped.getbbox()
    if bbox:
        bx1, by1, bx2, by2 = bbox
        return {
            "x": x1 + bx1,
            "y": y1 + by1,
            "w": bx2 - bx1,
            "h": by2 - by1
        }
    return None

zones = {
    # Hàng 1: Góc xoay 360 độ (2.5D Turnaround) + Idle
    "turn_front": (30, 50, 160, 260),
    "turn_34": (165, 50, 285, 260),
    "turn_side": (290, 50, 405, 260),
    "turn_back34": (410, 50, 535, 260),
    "turn_back": (540, 50, 665, 260),
    "idle_wave": (700, 50, 835, 260),
    "idle_back": (840, 50, 965, 260),

    # Hàng 2: Đi lại (Walk 1..4) + Rượt bướm (Chase 1..4)
    "walk_1": (25, 360, 145, 580),
    "walk_2": (140, 360, 255, 580),
    "walk_3": (250, 360, 360, 580),
    "walk_4": (355, 360, 470, 580),

    "chase_crouch": (465, 430, 585, 600),
    "chase_run": (585, 430, 705, 600),
    "chase_jump": (710, 370, 835, 600),
    "chase_celebrate": (840, 410, 975, 600),

    # Hàng 3: Ngủ (Sleep), Kéo thả (Dragged 1, 2), Nhận thông báo (Alert 1, 2)
    "sleep": (30, 600, 275, 765),
    "dragged_dizzy": (320, 540, 475, 765),
    "dragged_scared": (490, 540, 645, 765),
    "alert_startled": (695, 530, 825, 765),
    "alert_happy": (830, 530, 970, 765),
}

import json
results = {}
for name, box in zones.items():
    res = get_bbox(*box)
    results[name] = res
    print(f"{name}: {res}")

with open(r"src/entities/sprite_coords.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
print("Updated sprite coordinates to src/entities/sprite_coords.json")
