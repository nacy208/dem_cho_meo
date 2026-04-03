from inference import get_model
import supervision as sv
import cv2
import numpy as np

# yolov8n = nano, nhanh nhất, đủ dùng để đếm chó/mèo
_model = None

def get_cached_model():
    global _model
    if _model is None:
        _model = get_model(model_id="yolov8n-640")
    return _model

def _prepare_image(source):
    """Nhận path (str) hoặc numpy array BGR, trả về numpy array đã resize."""
    if isinstance(source, str):
        image = cv2.imread(source)
        if image is None:
            raise FileNotFoundError(f"Không đọc được ảnh: {source}")
    else:
        image = source
    # Đảm bảo cạnh dài >= 640 để YOLO detect tốt
    h, w = image.shape[:2]
    if max(w, h) < 640:
        scale = 640 / max(w, h)
        image = cv2.resize(image, (int(w * scale), int(h * scale)))
    return image

def _run_inference(image: np.ndarray):
    """Chạy YOLO, trả về Detections chỉ gồm dog/cat."""
    results    = get_cached_model().infer(image)[0]
    detections = sv.Detections.from_inference(results)
    class_names = detections.data.get("class_name", [])
    mask = [c.lower() in ("dog", "cat") for c in class_names]
    return detections[mask]

def ai_count_animals(source) -> dict:
    """Đếm chó/mèo. source = đường dẫn file hoặc numpy array BGR."""
    image      = _prepare_image(source)
    detections = _run_inference(image)
    names      = detections.data.get("class_name", [])
    dog = sum(1 for c in names if c.lower() == "dog")
    cat = sum(1 for c in names if c.lower() == "cat")
    return {"dog": dog, "cat": cat, "total": dog + cat, "predictions": list(names)}

def ai_annotate_image(source) -> np.ndarray:
    """Trả về ảnh BGR đã vẽ bounding box chó/mèo."""
    image      = _prepare_image(source)
    detections = _run_inference(image)
    annotated  = sv.BoxAnnotator().annotate(scene=image.copy(), detections=detections)
    annotated  = sv.LabelAnnotator().annotate(scene=annotated, detections=detections)
    return annotated
