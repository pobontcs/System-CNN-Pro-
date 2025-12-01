import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image

IMG_SIZE = (224, 224)

def preprocess_image(image: Image.Image, target_size=IMG_SIZE) -> np.ndarray:
    """
    Preprocess a PIL image for MobileNetV2 inference.

    Steps:
    - Resize → (224, 224)
    - Convert to NumPy
    - Convert to float32
    - Apply MobileNetV2 preprocess_input (scales to [-1, 1])
    """

    # Resize
    image = image.resize(target_size)

    # Convert to numpy float32
    img_array = np.array(image).astype("float32")

    # Preprocessing for MobileNetV2
    img_array = preprocess_input(img_array)

    return img_array
