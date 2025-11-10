import tensorflow as tf
import os

def load_data(data_dir,img_size=(224,224),batch_size=32):
    train_ds= tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=img_size,
        batch_size=batch_size,
    )
    
    val_