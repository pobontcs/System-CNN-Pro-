

import tensorflow as tf
from PIL import Image
import numpy as np
import io
from preprocessing import preprocess_image  


class_names = [
    'Pepper__bell__Bacterial_Spot',
    'Pepper__bell__healthy',
    'Potato__Early_blight',
    'Potato__healthy',
    'Potato__Late_blight',
    'Tomato__Target_Spot',
    'Tomato__Tomato_mosaic_virus',
    'Tomato__Tomato_YellowLeaf_Curl_Virus',
    'Tomato__Bacterial_spot',
    'Tomato__Early_blight',
    'Tomato__healthy',
    'Tomato__Late_blight',
    'Tomato__Leaf_Mold',
    'Tomato__Septoria_leaf_spot',
    'Tomato__Spider_mites_Two_spotted_spider_mite'
]

def map_class_to_name(class_index: int) -> str:
   
    if 0 <= class_index < len(class_names):
        return class_names[class_index]
    return "Unknown"

# Load the model once, so it’s ready for all predictions
model_path = '../model/plant_disease_model.h5'
model = tf.keras.models.load_model(model_path)

def predict_plant_disease(image_bytes: bytes) -> str:
    """
    Run inference on input image bytes and return predicted disease class name.

    Args:
        image_bytes (bytes): Raw image bytes (e.g., from uploaded file)

    Returns:
        str: Predicted disease class name
    """
    # Load image from bytes
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    # Preprocess image (resize, normalize)
    processed_image = preprocess_image(image)

    # Add batch dimension for model input
    input_arr = np.expand_dims(processed_image, axis=0)

    # Get prediction probabilities from model
    preds = model.predict(input_arr)

    # Get index of highest predicted probability
    predicted_class = np.argmax(preds, axis=1)[0]

    # Map index to class name
    disease_name = map_class_to_name(predicted_class)

    return disease_name
