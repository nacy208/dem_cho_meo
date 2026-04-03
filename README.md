# 🐾 Game Đếm Thú Cưng

Game đếm số chó và mèo trong ảnh, thi đấu với AI dùng YOLOv8.  
Hỗ trợ 2 chế độ: **Ảnh Tĩnh** (ảnh có sẵn) và **Ảnh AI Sinh** (tự động generate).

## Cấu trúc

```
├── web_server.py        # Flask backend + API
├── ai_player.py         # YOLOv8 detection (đối thủ AI)
├── image_generator.py   # Auto-generate ảnh bằng compositing
├── requirements.txt
├── anh_test/            # Ảnh nguồn (dùng cho classic + sprite extraction)
├── sprite_cache/        # Sprite chó/mèo đã crop (tự sinh)
├── backgrounds/         # Ảnh nền tuỳ chọn (để trống = dùng nền mặc định)
├── generated/           # Ảnh đã sinh ra (tạm thời)
└── web/
    ├── index.html
    ├── style.css
    ├── game.js
    └── anh_test/
        └── labels.json  # Đáp án cho chế độ ảnh tĩnh
```

## Cài đặt

```bash
pip install -r requirements.txt
```

## Chạy

```bash
python web_server.py
```

Mở trình duyệt: **http://localhost:5000**

## Hai chế độ chơi

### 🖼️ Ảnh Tĩnh (Classic)
- Dùng ảnh có sẵn trong `anh_test/`
- Đáp án lấy từ `web/anh_test/labels.json`
- AI (YOLOv8) đếm và so sánh với đáp án

### ✨ Ảnh AI Sinh (Generated)
- Tự động sinh ảnh mới mỗi vòng bằng cách ghép sprite
- **Ground truth = 100% chính xác** (biết chính xác đã ghép bao nhiêu con)
- AI (YOLOv8) đếm ảnh generated để cạnh tranh với người chơi
- Lần đầu chạy sẽ tự build sprite cache (~30 giây)

## Thêm ảnh nền tuỳ chỉnh

Thêm ảnh `.jpg`/`.png` vào thư mục `backgrounds/` để dùng làm nền cho ảnh generated.

## Build sprite cache thủ công

```bash
python image_generator.py --build-cache
```

## API

| Endpoint | Mô tả |
|---|---|
| `GET /api/random-image` | Lấy tên ảnh tĩnh ngẫu nhiên |
| `GET /api/analyze/<file>` | YOLO phân tích ảnh tĩnh |
| `GET /api/generate` | Sinh ảnh mới (params: dogs, cats, min, max) |
| `POST /api/generate/analyze` | YOLO phân tích ảnh generated |
| `GET /api/build-cache` | Build sprite cache |
| `GET /api/status` | Trạng thái server |
# dem_cho_meo
