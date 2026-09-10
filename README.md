# Cortex — Brain Tumor MRI Classifier (Local Web App)

A local-hosted dashboard for your brain tumor MRI classifier: live prediction,
persistent history, and model performance metrics — no Colab, no Gradio,
no internet dependency once set up.

## Setup

1. **Install dependencies** (Python 3.9–3.12 recommended):
   ```
   pip install -r requirements.txt
   ```

2. **Add your trained model.** Copy `best_model_final.keras` from your Google
   Drive (`BrainTumor_Models/best_model_final.keras`) into this same folder,
   right next to `app.py`.

3. **(Optional) Add your confusion matrix image.** If you have
   `confusion_matrix_final.png` from the evaluation script, drop it into the
   `static/` folder. It'll automatically appear on the Performance tab. If
   you skip this, the tab still works — it just won't show the image.

4. **(Optional) Update classification_report.json.** A copy with your
   already-verified metrics (85.31% accuracy) is included. If you re-run
   `full_evaluation.py` later and get a new `classification_report.json`,
   just replace this file with that one.

## Run it

```
python app.py
```

Then open **http://localhost:5000** in your browser.

## What's inside

- **Predict tab** — drag and drop or click to upload an MRI scan; get an
  instant classification with a confidence breakdown across all four classes.
- **Recent history tab** — every scan you analyze is saved (image + result)
  to a local `history.json` file and `static/history_images/` folder, so it
  persists even after closing the app. Clear it anytime with one click.
- **Model performance tab** — your test accuracy, confusion matrix, and full
  precision/recall/F1 breakdown per class, all in one place — ready to
  screenshot for a report or presentation.

## Folder structure

```
brain_tumor_webapp/
├── app.py                        # Flask backend
├── best_model_final.keras        # <- you add this
├── classification_report.json    # pre-filled with your verified results
├── requirements.txt
├── history.json                  # created automatically on first prediction
├── templates/
│   └── index.html
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
