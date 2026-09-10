# 🧠 Cortex — Brain Tumor MRI Classifier

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.20-orange?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Test Accuracy](https://img.shields.io/badge/Test%20Accuracy-85.31%25-brightgreen)](#model-performance)
[![License](https://img.shields.io/badge/License-Educational%20Use-lightgrey)](#license)

A local-hosted dashboard for your brain tumor MRI classifier: live prediction,
persistent history, and model performance metrics — no Colab, no Gradio,
no internet dependency once set up.

## Setup

1. **Install dependencies** (Python 3.9–3.12 recommended):
   ```
   pip install -r requirements.txt
   ```

### Run

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

## Project Structure

```
cortex-brain-tumor-classifier/
├── app.py                        # Flask backend + inference API
├── best_model_final.keras        # Trained model (85.31% test accuracy)
├── classification_report.json    # Precision/recall/F1 per class
├── requirements.txt
├── templates/
│   └── index.html                # Dashboard shell
└── static/
    ├── css/style.css
    ├── js/script.js
    ├── history_images/           # saved scan thumbnails
    └── confusion_matrix_final.png  # <- you add this (optional)
```

## Notes

- This is a **local single-user tool** — it's not hardened for public
  deployment (no auth, no rate limiting). Keep it on `localhost` unless you
  specifically set up proper security for a shared deployment.
- Educational/demonstration use only — not a medical diagnostic device.
