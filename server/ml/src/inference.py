import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
from .preprocessing import preprocess_image
import os

MODEL_PATH = os.path.abspath(os.path.join("..",'server','ml', "model", "plant_disease_model.h5"))


IMG_SIZE = (224, 224)

# Load model once at startup
model = load_model(MODEL_PATH)

def predict_image(image: Image.Image, class_names: list) -> dict:
    """
    Run inference on a PIL image using the trained model.

    Args:
        image (PIL.Image): Input image
        class_names (list): Mapping of indices -> class names

    Returns:
        dict: { "label": str, "confidence": float }
    """

    # Preprocess image
    img_array = preprocess_image(image, IMG_SIZE)

    # Add batch dimension
    img_batch = np.expand_dims(img_array, axis=0)

    # Predict
    preds = model.predict(img_batch)
    class_index = np.argmax(preds[0])
    confidence = float(np.max(preds[0]))

    return {
        "label": class_names[class_index],
        "confidence": confidence
    }
