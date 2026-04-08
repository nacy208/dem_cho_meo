"""
Entry point cho Hugging Face Spaces.
HF Spaces yêu cầu file app.py và port 7860.
"""
import os
os.environ["CORE_MODEL_SAM_ENABLED"] = "False"
os.environ["CORE_MODEL_SAM3_ENABLED"] = "False"
os.environ["CORE_MODEL_GAZE_ENABLED"] = "False"

from web_server import app, get_sprite_pool
import threading

if __name__ == "__main__":
    threading.Thread(target=get_sprite_pool, daemon=True).start()
    app.run(host="0.0.0.0", port=7860, debug=False, threaded=True)
