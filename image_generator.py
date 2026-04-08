"""
image_generator.py
------------------
Tự động sinh ảnh game bằng cách:
1. Dùng YOLOv8 segment để crop từng con chó/mèo từ ảnh nguồn
2. Ghép ngẫu nhiên N con lên background ngẫu nhiên
3. Trả về ảnh (numpy BGR) + ground truth (dog, cat, total)

Không cần labels.json — ground truth = số con đã ghép.
"""

import os
import cv2
import random
import numpy as np
from pathlib import Path

# ── Thư mục ──────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).parent
SOURCE_DIR    = BASE_DIR / "train"             # ảnh nguồn để crop thú
BG_DIR        = BASE_DIR / "backgrounds"       # ảnh nền (tự tạo nếu thiếu)
CACHE_DIR     = BASE_DIR / "sprite_cache"      # lưu sprite đã crop
GENERATED_DIR = BASE_DIR / "generated"         # ảnh đã sinh ra

for d in (BG_DIR, CACHE_DIR, GENERATED_DIR):
    d.mkdir(exist_ok=True)

SUPPORTED = (".jpg", ".jpeg", ".png")

# ── Lazy model ────────────────────────────────────────────────────────────────
_seg_model = None

def _get_seg_model():
    """Load YOLOv8x-seg lần đầu, cache lại."""
    global _seg_model
    if _seg_model is None:
        from inference import get_model
        _seg_model = get_model(model_id="yolov8x-seg-640")
    return _seg_model

# ── Sprite extraction ─────────────────────────────────────────────────────────

def _extract_sprites_from_image(img_path: str) -> list[dict]:
    """
    Chạy YOLO-seg trên một ảnh, trả về list sprite dict:
      { "label": "dog"|"cat", "image": np.ndarray BGRA (có alpha) }
    """
    import supervision as sv

    image = cv2.imread(img_path)
    if image is None:
        return []

    model  = _get_seg_model()
    result = model.infer(image)[0]
    dets   = sv.Detections.from_inference(result)

    class_names = dets.data.get("class_name", [])
    sprites = []

    for i, cls in enumerate(class_names):
        cls_lower = cls.lower()
        if cls_lower not in ("dog", "cat"):
            continue

        # Bounding box
        x1, y1, x2, y2 = map(int, dets.xyxy[i])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(image.shape[1], x2), min(image.shape[0], y2)
        if x2 <= x1 or y2 <= y1:
            continue

        crop_bgr = image[y1:y2, x1:x2].copy()

        # Tạo alpha mask từ segmentation mask nếu có
        if dets.mask is not None and i < len(dets.mask):
            seg_mask = dets.mask[i].astype(np.uint8) * 255  # H×W
            alpha    = seg_mask[y1:y2, x1:x2]
        else:
            # Fallback: GrabCut đơn giản
            alpha = _grabcut_alpha(crop_bgr)

        # Làm mềm viền alpha
        alpha = cv2.GaussianBlur(alpha, (5, 5), 0)

        # Ghép thành BGRA
        bgra = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2BGRA)
        bgra[:, :, 3] = alpha

        sprites.append({"label": cls_lower, "image": bgra})

    return sprites


def _grabcut_alpha(crop_bgr: np.ndarray) -> np.ndarray:
    """Fallback: dùng GrabCut để tách foreground."""
    h, w = crop_bgr.shape[:2]
    if h < 10 or w < 10:
        return np.ones((h, w), dtype=np.uint8) * 255

    mask   = np.zeros((h, w), np.uint8)
    bgdMdl = np.zeros((1, 65), np.float64)
    fgdMdl = np.zeros((1, 65), np.float64)
    rect   = (2, 2, w - 4, h - 4)
    try:
        cv2.grabCut(crop_bgr, mask, rect, bgdMdl, fgdMdl, 3, cv2.GC_INIT_WITH_RECT)
        fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    except Exception:
        fg = np.ones((h, w), dtype=np.uint8) * 255
    return fg


def build_sprite_cache(source_dir: str = str(SOURCE_DIR)) -> int:
    """
    Quét toàn bộ ảnh trong source_dir, extract sprite, lưu vào CACHE_DIR.
    Trả về số sprite đã lưu.
    """
    saved = 0
    for img_file in Path(source_dir).iterdir():
        if img_file.suffix.lower() not in SUPPORTED:
            continue
        sprites = _extract_sprites_from_image(str(img_file))
        for idx, sp in enumerate(sprites):
            fname = f"{img_file.stem}_{sp['label']}_{idx}.png"
            out   = CACHE_DIR / fname
            cv2.imwrite(str(out), sp["image"])
            saved += 1
    return saved


def load_sprite_cache() -> dict[str, list[np.ndarray]]:
    """
    Load tất cả sprite PNG từ CACHE_DIR.
    Trả về {"dog": [...], "cat": [...]}
    """
    pool: dict[str, list[np.ndarray]] = {"dog": [], "cat": []}
    for f in CACHE_DIR.iterdir():
        if f.suffix.lower() != ".png":
            continue
        img = cv2.imread(str(f), cv2.IMREAD_UNCHANGED)
        if img is None or img.shape[2] != 4:
            continue
        for label in ("dog", "cat"):
            if f"_{label}_" in f.name:
                pool[label].append(img)
                break
    return pool

# ── Background ────────────────────────────────────────────────────────────────

def _get_backgrounds() -> list[np.ndarray]:
    """Load ảnh nền từ BG_DIR. Nếu không có, tạo nền màu đơn giản."""
    bgs = []
    for f in BG_DIR.iterdir():
        if f.suffix.lower() in SUPPORTED:
            img = cv2.imread(str(f))
            if img is not None:
                bgs.append(img)

    if not bgs:
        # Sinh nền gradient đơn giản
        for color in [(200, 220, 200), (220, 200, 180), (180, 200, 220)]:
            bg = np.full((480, 640, 3), color, dtype=np.uint8)
            # Thêm chút noise cho tự nhiên
            noise = np.random.randint(0, 20, bg.shape, dtype=np.uint8)
            bg = cv2.add(bg, noise)
            bgs.append(bg)
    return bgs


def _paste_sprite(canvas: np.ndarray, sprite_bgra: np.ndarray,
                  x: int, y: int, scale: float = 1.0) -> None:
    """Dán sprite BGRA lên canvas BGR tại vị trí (x, y) với alpha blending."""
    sh, sw = sprite_bgra.shape[:2]
    new_w  = max(1, int(sw * scale))
    new_h  = max(1, int(sh * scale))
    sprite = cv2.resize(sprite_bgra, (new_w, new_h))

    ch, cw = canvas.shape[:2]

    # Clip vào canvas
    x1c, y1c = max(0, x), max(0, y)
    x2c, y2c = min(cw, x + new_w), min(ch, y + new_h)
    x1s = x1c - x
    y1s = y1c - y
    x2s = x1s + (x2c - x1c)
    y2s = y1s + (y2c - y1c)

    if x2c <= x1c or y2c <= y1c:
        return

    roi    = canvas[y1c:y2c, x1c:x2c]
    sp_roi = sprite[y1s:y2s, x1s:x2s]

    alpha  = sp_roi[:, :, 3:4].astype(np.float32) / 255.0
    fg     = sp_roi[:, :, :3].astype(np.float32)
    bg     = roi.astype(np.float32)

    blended = fg * alpha + bg * (1 - alpha)
    canvas[y1c:y2c, x1c:x2c] = blended.astype(np.uint8)

# ── Main generate function ────────────────────────────────────────────────────

def generate_image(
    n_dogs: int = -1,
    n_cats: int = -1,
    max_total: int = 8,
    min_total: int = 1,
    canvas_size: tuple[int, int] = (480, 640),   # (H, W)
    sprite_pool: dict | None = None,
) -> dict:
    """
    Sinh một ảnh game mới.

    Params:
        n_dogs, n_cats : số con cụ thể (-1 = ngẫu nhiên)
        max_total      : tổng tối đa nếu random
        min_total      : tổng tối thiểu nếu random
        canvas_size    : kích thước ảnh output (H, W)
        sprite_pool    : dict {"dog": [...], "cat": [...]} — truyền vào để tránh load lại

    Returns dict:
        {
          "image"     : np.ndarray BGR,
          "dog"       : int,
          "cat"       : int,
          "total"     : int,
          "ground_truth": int   # = total, dùng làm đáp án
        }
    """
    if sprite_pool is None:
        sprite_pool = load_sprite_cache()

    dogs_avail = sprite_pool.get("dog", [])
    cats_avail = sprite_pool.get("cat", [])

    # Quyết định số lượng
    if n_dogs < 0 or n_cats < 0:
        total = random.randint(min_total, max_total)
        if dogs_avail and cats_avail:
            n_dogs = random.randint(0, total)
            n_cats = total - n_dogs
        elif dogs_avail:
            n_dogs, n_cats = total, 0
        elif cats_avail:
            n_dogs, n_cats = 0, total
        else:
            raise RuntimeError("Sprite cache trống! Chạy build_sprite_cache() trước.")
    else:
        total = n_dogs + n_cats

    # Clamp nếu không đủ sprite
    n_dogs = min(n_dogs, len(dogs_avail) * 3)  # cho phép dùng lại sprite
    n_cats = min(n_cats, len(cats_avail) * 3)

    if n_dogs == 0 and n_cats == 0:
        raise RuntimeError("Không đủ sprite để sinh ảnh.")

    # Chọn background
    bgs = _get_backgrounds()
    canvas = random.choice(bgs).copy()
    canvas = cv2.resize(canvas, (canvas_size[1], canvas_size[0]))

    ch, cw = canvas.shape[:2]

    # Ghép sprite — chia grid để tránh chồng chéo quá nhiều
    all_sprites = (
        [(random.choice(dogs_avail), "dog") for _ in range(n_dogs)] +
        [(random.choice(cats_avail), "cat") for _ in range(n_cats)]
    )
    random.shuffle(all_sprites)

    n_total = len(all_sprites)
    cols    = max(1, int(np.ceil(np.sqrt(n_total))))
    rows    = max(1, int(np.ceil(n_total / cols)))
    cell_w  = cw // cols
    cell_h  = ch // rows

    for idx, (sprite, _) in enumerate(all_sprites):
        col = idx % cols
        row = idx // cols

        sh, sw = sprite.shape[:2]
        # Scale sprite vừa cell, giữ tỉ lệ
        scale = min(cell_w / sw, cell_h / sh) * random.uniform(0.55, 0.85)

        # Vị trí ngẫu nhiên trong cell
        max_x = max(0, cell_w - int(sw * scale))
        max_y = max(0, cell_h - int(sh * scale))
        ox = random.randint(0, max_x)
        oy = random.randint(0, max_y)

        x = col * cell_w + ox
        y = row * cell_h + oy

        _paste_sprite(canvas, sprite, x, y, scale)

    return {
        "image"       : canvas,
        "dog"         : n_dogs,
        "cat"         : n_cats,
        "total"       : n_dogs + n_cats,
        "ground_truth": n_dogs + n_cats,
    }


def save_generated(result: dict, filename: str | None = None) -> str:
    """Lưu ảnh generated vào GENERATED_DIR, trả về đường dẫn."""
    if filename is None:
        import time
        filename = f"gen_{int(time.time()*1000)}.jpg"
    out_path = str(GENERATED_DIR / filename)
    cv2.imwrite(out_path, result["image"])
    return out_path


# ── CLI test ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if "--build-cache" in sys.argv:
        print("Đang build sprite cache...")
        n = build_sprite_cache()
        print(f"Đã lưu {n} sprite vào {CACHE_DIR}")
    else:
        print("Load sprite cache...")
        pool = load_sprite_cache()
        print(f"  dog sprites: {len(pool['dog'])}, cat sprites: {len(pool['cat'])}")

        print("Sinh ảnh test...")
        result = generate_image(sprite_pool=pool)
        path   = save_generated(result, "test_generated.jpg")
        print(f"  Đã lưu: {path}")
        print(f"  Chó: {result['dog']}, Mèo: {result['cat']}, Tổng: {result['total']}")

        cv2.imshow("Generated", result["image"])
        cv2.waitKey(0)
        cv2.destroyAllWindows()
