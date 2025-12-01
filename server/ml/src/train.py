import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing import image_dataset_from_directory
import os
import json

# ------------------------------- PATHS -------------------------------
DATA_DIR = "../data/PlantVillage"

MODEL_SAVE_PATH_H5 = "../model/plant_disease_model.h5"
MODEL_SAVE_PATH_KERAS = "../model/plant_disease_model.keras"
CLASS_INDEX_PATH = "../model/class_indices.json"

# ------------------------------- CONFIG -------------------------------
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20


# Enable GPU memory growth (optional)
def enable_gpu_memory_growth():
    gpus = tf.config.experimental.list_physical_devices("GPU")
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print("[INFO] GPU memory growth enabled.")
        except RuntimeError as e:
            print(e)


# ------------------------------- DATA LOADING -------------------------------
def load_data():
    # Load raw datasets first (without mapping)
    raw_train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int"
    )

    raw_val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int"
    )

    # Extract class names BEFORE mapping
    class_names = raw_train_ds.class_names

    # Preprocessing func
    def preprocess(image, label):
        return preprocess_input(image), label

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = raw_train_ds.map(preprocess).cache().prefetch(AUTOTUNE)
    val_ds = raw_val_ds.map(preprocess).cache().prefetch(AUTOTUNE)

    return train_ds, val_ds, class_names



# ------------------------------- MODEL BUILD -------------------------------
def build_model(num_classes):
    """
    Build a MobileNetV2-based classifier
    """

    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base.trainable = False  # Freeze backbone initially

    x = GlobalAveragePooling2D()(base.output)
    x = Dropout(0.3)(x)
    output = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base.input, outputs=output)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model


# ------------------------------- TRAINING LOOP -------------------------------
def train():
    enable_gpu_memory_growth()

    # Load data (NOW returns 3 values)
    train_ds, val_ds, class_names = load_data()

    # Detect number of classes
    num_classes = len(class_names)

    print("🔍 Found Classes:", class_names)

    # Save class indices mapping
    class_indices = {i: label for i, label in enumerate(class_names)}
    os.makedirs("model", exist_ok=True)

    with open(CLASS_INDEX_PATH, "w") as f:
        json.dump(class_indices, f, indent=4)

    print("📁 Saved class_indices.json")

    # Build model
    model = build_model(num_classes)

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=4,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH_H5,
            monitor="val_accuracy",
            save_best_only=True
        )
    ]

    # Train
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks
    )

    # Save Keras model format
    model.save(MODEL_SAVE_PATH_KERAS)

    print(f"[INFO] Saved H5 model → {MODEL_SAVE_PATH_H5}")
    print(f"[INFO] Saved Keras model → {MODEL_SAVE_PATH_KERAS}")

    return history



# ------------------------------- MAIN -------------------------------
if __name__ == "__main__":
    train()
