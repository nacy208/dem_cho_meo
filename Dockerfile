FROM python:3.11-slim

# Cài system dependencies cho opencv
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tạo các folder cần thiết
RUN mkdir -p sprite_cache generated backgrounds

EXPOSE 7860

ENV PORT=7860
ENV CORE_MODEL_SAM_ENABLED=False
ENV CORE_MODEL_SAM3_ENABLED=False
ENV CORE_MODEL_GAZE_ENABLED=False

CMD ["python", "app.py"]
