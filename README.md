---
title: Game Đếm Thú Cưng
emoji: 🐾
colorFrom: yellow
colorTo: orange
sdk: docker
pinned: false
---

# 🐾 Game Đếm Thú Cưng

Game đếm số chó và mèo trong ảnh, thi đấu với AI dùng YOLOv8.  
Hỗ trợ 2 chế độ: **Ảnh Tĩnh** (ảnh có sẵn) và **Ảnh AI Sinh** (tự động generate).

## Chạy local

```bash
pip install -r requirements.txt
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
- Ground truth = 100% chính xác
- Lần đầu chạy sẽ tự build sprite cache (~30 giây)

## Build sprite cache thủ công

```bash
python image_generator.py --build-cache
```
