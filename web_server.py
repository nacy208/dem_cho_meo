import os
import warnings
os.environ["CORE_MODEL_SAM_ENABLED"] = "False"
os.environ["CORE_MODEL_SAM3_ENABLED"] = "False"
os.environ["CORE_MODEL_GAZE_ENABLED"] = "False"
warnings.filterwarnings("ignore")

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import cv2
import base64
import random
import json
import threading
import time

app = Flask(__name__, static_folder="web")
CORS(app)

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "anh_test")
LABELS_FILE = os.path.join(os.path.dirname(__file__), "web", "anh_test", "labels.json")
SUPPORTED = (".jpg", ".jpeg", ".png", ".bmp", ".webp")

with open(LABELS_FILE, encoding="utf-8") as f:
    LABELS = json.load(f)

# ── Lazy load AI ──────────────────────────────────────────────────────────────
_ai_ready = False
_ai_lock  = threading.Lock()
_sprite_pool = None   # cache sprite cho generator

def ensure_ai():
    global _ai_ready
    if not _ai_ready:
        with _ai_lock:
            if not _ai_ready:
                global ai_count_animals, ai_annotate_image
                from ai_player import ai_count_animals, ai_annotate_image
                from ai_player import get_cached_model
                get_cached_model()
                _ai_ready = True

def get_sprite_pool():
    """Load sprite cache một lần, tái dùng cho mọi request generate."""
    global _sprite_pool
    if _sprite_pool is None:
        from image_generator import load_sprite_cache, build_sprite_cache, CACHE_DIR
        pool = load_sprite_cache()
        # Nếu cache trống → tự build từ anh_test
        if not pool["dog"] and not pool["cat"]:
            print("[Generator] Sprite cache trống, đang build...")
            n = build_sprite_cache()
            print(f"[Generator] Đã build {n} sprite")
            pool = load_sprite_cache()
        _sprite_pool = pool
        print(f"[Generator] Sprite pool: dog={len(pool['dog'])}, cat={len(pool['cat'])}")
    return _sprite_pool

# ── Helpers ───────────────────────────────────────────────────────────────────

def image_to_b64(img_bgr) -> str:
    _, buf = cv2.imencode(".jpg", img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

def get_image_pool():
    return [f for f in os.listdir(IMAGES_DIR)
            if f.lower().endswith(SUPPORTED) and f in LABELS]

# ── Static ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("web", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("web", path)

# ── Status ────────────────────────────────────────────────────────────────────

@app.route("/api/status")
def status():
    pool = _sprite_pool or {"dog": [], "cat": []}
    return jsonify({
        "ai_ready"  : _ai_ready,
        "sprite_dog": len(pool["dog"]),
        "sprite_cat": len(pool["cat"]),
    })

# ── Classic mode (ảnh tĩnh) ───────────────────────────────────────────────────

@app.route("/api/random-image")
def random_image():
    pool = get_image_pool()
    chosen = random.choice(pool)
    return jsonify({"filename": chosen})

@app.route("/api/analyze/<filename>")
def analyze(filename):
    ensure_ai()
    path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    result = ai_count_animals(path)
    result["correct"] = LABELS.get(filename, -1)

    annotated = ai_annotate_image(path)
    result["annotated"] = image_to_b64(annotated)
    return jsonify(result)

@app.route("/api/image/<filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)

# ── Generated mode (ảnh tự sinh) ─────────────────────────────────────────────

@app.route("/api/generate")
def generate():
    """
    Sinh ảnh mới bằng compositing.
    Query params (tuỳ chọn):
      dogs=N, cats=N   → số con cụ thể
      min=N, max=N     → khoảng random (mặc định 1-8)
    Trả về:
      { image_b64, dog, cat, total, ground_truth }
    """
    try:
        pool = get_sprite_pool()

        n_dogs = int(request.args.get("dogs", -1))
        n_cats = int(request.args.get("cats", -1))
        min_t  = int(request.args.get("min", 1))
        max_t  = int(request.args.get("max", 8))

        from image_generator import generate_image
        result = generate_image(
            n_dogs=n_dogs,
            n_cats=n_cats,
            min_total=min_t,
            max_total=max_t,
            sprite_pool=pool,
        )

        return jsonify({
            "image_b64"    : image_to_b64(result["image"]),
            "dog"          : result["dog"],
            "cat"          : result["cat"],
            "total"        : result["total"],
            "ground_truth" : result["ground_truth"],
        })

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate/analyze", methods=["POST"])
def generate_analyze():
    """
    Nhận ảnh generated (base64) + ground_truth, chạy YOLO đếm thú,
    trả về kết quả AI + ảnh annotated — xử lý hoàn toàn in-memory.
    """
    ensure_ai()
    data = request.get_json()
    if not data or "image_b64" not in data:
        return jsonify({"error": "Missing image_b64"}), 400

    import numpy as np
    b64 = data["image_b64"].split(",")[-1]
    buf = np.frombuffer(base64.b64decode(b64), dtype=np.uint8)
    arr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if arr is None:
        return jsonify({"error": "Cannot decode image"}), 400

    # Truyền numpy array thẳng vào — không cần lưu file tạm
    ai_result = ai_count_animals(arr)
    annotated = ai_annotate_image(arr)

    ai_result["correct"]   = data.get("ground_truth", -1)
    ai_result["annotated"] = image_to_b64(annotated)
    return jsonify(ai_result)


@app.route("/api/build-cache")
def build_cache():
    """Trigger build sprite cache (chạy 1 lần khi setup)."""
    from image_generator import build_sprite_cache
    global _sprite_pool
    _sprite_pool = None   # reset để reload sau khi build
    n = build_sprite_cache()
    return jsonify({"built": n})


if __name__ == "__main__":
    print("Server chạy tại http://localhost:5000")
    # Pre-load sprite pool khi khởi động
    threading.Thread(target=get_sprite_pool, daemon=True).start()
    app.run(port=5000, debug=False, threaded=True)
