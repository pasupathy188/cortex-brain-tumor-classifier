

import os
import json
import base64
import datetime
from io import BytesIO

import numpy as np
from flask import Flask, request, jsonify, render_template, send_from_directory
from PIL import Image
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'best_model_final.keras')
HISTORY_IMAGES_DIR = os.path.join(BASE_DIR, 'static', 'history_images')
HISTORY_LOG_PATH = os.path.join(BASE_DIR, 'history.json')
CLASSIFICATION_REPORT_PATH = os.path.join(BASE_DIR, 'classification_report.json')
CONFUSION_MATRIX_FILENAME = 'confusion_matrix_final.png'  # place this in static/ if you have it

os.makedirs(HISTORY_IMAGES_DIR, exist_ok=True)

CLASS_NAMES = ['glioma', 'meningioma', 'pituitary', 'notumor']
CLASS_LABELS = {
    'glioma': 'Glioma',
    'meningioma': 'Meningioma',
    'pituitary': 'Pituitary Tumor',
    'notumor': 'No Tumor'
}
IMG_SIZE = (224, 224)

# Fallback metrics (from the verified Colab evaluation run) used only
# if classification_report.json isn't present alongside this script.
FALLBACK_REPORT = {
    "Glioma":          {"precision": 0.8746, "recall": 0.6975, "f1-score": 0.7761, "support": 400},
    "Meningioma":      {"precision": 0.7775, "recall": 0.7600, "f1-score": 0.7686, "support": 400},
    "Pituitary Tumor": {"precision": 0.8455, "recall": 0.9850, "f1-score": 0.9099, "support": 400},
    "No Tumor":        {"precision": 0.9151, "recall": 0.9700, "f1-score": 0.9417, "support": 400},
    "accuracy": 0.8531,
    "macro avg":    {"precision": 0.8532, "recall": 0.8531, "f1-score": 0.8491, "support": 1600},
    "weighted avg": {"precision": 0.8532, "recall": 0.8531, "f1-score": 0.8491, "support": 1600},
}

app = Flask(__name__)

print(f"Loading model from: {MODEL_PATH}")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found at {MODEL_PATH}. "
        f"Place best_model_final.keras in the same folder as app.py."
    )
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully.")


# ------------------------------------------------------------
# History persistence
# ------------------------------------------------------------
def load_history():
    if os.path.exists(HISTORY_LOG_PATH):
        with open(HISTORY_LOG_PATH) as f:
            return json.load(f)
    return []


def save_history(entries):
    with open(HISTORY_LOG_PATH, 'w') as f:
        json.dump(entries, f, indent=2)


def append_history(image_filename, prediction, confidence, probabilities):
    entries = load_history()
    entries.insert(0, {
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'image': image_filename,
        'prediction': prediction,
        'confidence': round(confidence * 100, 2),
        'probabilities': {k: round(v * 100, 2) for k, v in probabilities.items()}
    })
    entries = entries[:100]
    save_history(entries)


# ------------------------------------------------------------
# Routes
# ------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    img = Image.open(file.stream).convert('RGB')

    resized = img.resize(IMG_SIZE)
    img_array = tf.keras.utils.img_to_array(resized)
    img_array = np.expand_dims(img_array, axis=0)  # raw [0,255], no manual rescale

    preds = model.predict(img_array, verbose=0)[0]
    probabilities = {CLASS_LABELS[CLASS_NAMES[i]]: float(preds[i]) for i in range(len(CLASS_NAMES))}
    top_label = max(probabilities, key=probabilities.get)
    top_conf = probabilities[top_label]

    # Save the image for history
    timestamp_str = datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    image_filename = f'{timestamp_str}.jpg'
    img.save(os.path.join(HISTORY_IMAGES_DIR, image_filename), quality=85)

    append_history(image_filename, top_label, top_conf, probabilities)

    return jsonify({
        'prediction': top_label,
        'confidence': round(top_conf * 100, 2),
        'probabilities': {k: round(v * 100, 2) for k, v in probabilities.items()},
        'image': f'/static/history_images/{image_filename}'
    })


@app.route('/api/history', methods=['GET'])
def get_history():
    entries = load_history()
    for e in entries:
        e['image_url'] = f'/static/history_images/{e["image"]}'
    return jsonify(entries)


@app.route('/api/history', methods=['DELETE'])
def clear_history():
    save_history([])
    for f in os.listdir(HISTORY_IMAGES_DIR):
        try:
            os.remove(os.path.join(HISTORY_IMAGES_DIR, f))
        except OSError:
            pass
    return jsonify({'status': 'cleared'})


@app.route('/api/performance', methods=['GET'])
def get_performance():
    if os.path.exists(CLASSIFICATION_REPORT_PATH):
        with open(CLASSIFICATION_REPORT_PATH) as f:
            report = json.load(f)
    else:
        report = FALLBACK_REPORT

    confusion_matrix_url = None
    if os.path.exists(os.path.join(BASE_DIR, 'static', CONFUSION_MATRIX_FILENAME)):
        confusion_matrix_url = f'/static/{CONFUSION_MATRIX_FILENAME}'

    return jsonify({
        'report': report,
        'confusion_matrix_url': confusion_matrix_url
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
