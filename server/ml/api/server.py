from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import uvicorn
import json
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model/plant_disease_model.h5")
CLASS_MAP_PATH = os.path.join(BASE_DIR, "model/class_indices.json")

# Load model
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Model load error: {e}")
    model = None

# Load class mapping (folder → index)
if os.path.exists(CLASS_MAP_PATH):
    with open(CLASS_MAP_PATH, "r") as f:
        mapping = json.load(f)
    INV_MAP = {int(k): v for k, v in mapping.items()}

else:
    print("⚠ No class_indices.json found. Labels will be None.")
    INV_MAP = {}

CROP_CLASS_GROUPS = {
    "pepper": [0, 1],
    "potato": [2, 3, 4],
    "tomato": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
}


def preprocess(img: Image.Image):
    img = img.convert("RGB")
    img = img.resize((224, 224))
    img = np.array(img)

    # IMPORTANT FIX
    img = preprocess_input(img)

    img = np.expand_dims(img, axis=0)
    return img

@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    crop_type: str = Form(None),
    crop_stage: str = Form(None),
    lat: float = Form(None),
    lon: float = Form(None),
    acc: float = Form(None),
):
    try:
        img_pil = Image.open(file.file)
        img_array = preprocess(img_pil)

        preds = model.predict(img_array)[0]

        # Filter if crop type provided
        if crop_type and crop_type.lower() in CROP_CLASS_GROUPS:
            allowed = CROP_CLASS_GROUPS[crop_type.lower()]
            filtered = {i: preds[i] for i in allowed}
            best_class_id = max(filtered, key=filtered.get)
            confidence = float(filtered[best_class_id])
        else:
            best_class_id = int(np.argmax(preds))
            confidence = float(np.max(preds))

        label = INV_MAP.get(best_class_id, "Unknown")

        return {
            "class_id": best_class_id,
            "label": label,
            "confidence": confidence,
            "crop_type": crop_type,
            "crop_stage": crop_stage,
            "lat": lat,
            "lon": lon,
            "acc": acc,
        }

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=2526)
