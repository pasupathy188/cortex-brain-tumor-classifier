const CLASS_COLOR_VARS = {
  'Glioma': '--glioma',
  'Meningioma': '--meningioma',
  'Pituitary Tumor': '--pituitary',
  'No Tumor': '--notumor',
};

function colorFor(className) {
  const varName = CLASS_COLOR_VARS[className] || '--accent';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/* ------------------------------------------------------------
   Navigation
   ------------------------------------------------------------ */
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('is-active'));
    views.forEach(v => v.classList.remove('is-active'));
    item.classList.add('is-active');
    document.getElementById('view-' + item.dataset.view).classList.add('is-active');

    if (item.dataset.view === 'history') loadHistory();
    if (item.dataset.view === 'performance') loadPerformance();
  });
});

/* ------------------------------------------------------------
   Predict view
   ------------------------------------------------------------ */
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const dropzoneEmpty = document.getElementById('dropzoneEmpty');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultEmpty = document.getElementById('resultEmpty');
const resultContent = document.getElementById('resultContent');
const resultLabel = document.getElementById('resultLabel');
const resultConfidence = document.getElementById('resultConfidence');
const barsContainer = document.getElementById('bars');

let selectedFile = null;

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('is-dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('is-dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewImage.hidden = false;
    dropzoneEmpty.hidden = true;
  };
  reader.readAsDataURL(file);
  analyzeBtn.disabled = false;
}

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing…';

  const formData = new FormData();
  formData.append('image', selectedFile);

  try {
    const res = await fetch('/api/predict', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderResult(data);
  } catch (err) {
    alert('Prediction failed: ' + err.message);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze scan';
  }
});

function renderResult(data) {
  resultEmpty.hidden = true;
  resultContent.hidden = false;

  resultLabel.textContent = data.prediction;
  resultLabel.style.color = colorFor(data.prediction);
  resultConfidence.textContent = data.confidence.toFixed(2) + '%';

  const sorted = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);
  barsContainer.innerHTML = '';
  sorted.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${value}%; background:${colorFor(label)}"></div></div>
      <span class="bar-value">${value.toFixed(1)}%</span>
    `;
    barsContainer.appendChild(row);
  });
}

/* ------------------------------------------------------------
   History view
   ------------------------------------------------------------ */
const historyGrid = document.getElementById('historyGrid');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

async function loadHistory() {
  const res = await fetch('/api/history');
  const entries = await res.json();

  if (!entries.length) {
    historyGrid.innerHTML = '<p class="empty-note">No predictions yet.</p>';
    return;
  }

  historyGrid.innerHTML = '';
  entries.forEach(e => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <img src="${e.image_url}" alt="${e.prediction}">
      <div class="history-card-body">
        <div class="history-card-label" style="color:${colorFor(e.prediction)}">${e.prediction}</div>
        <div class="history-card-meta">${e.confidence.toFixed(1)}% · ${e.timestamp}</div>
      </div>
    `;
    historyGrid.appendChild(card);
  });
}

refreshHistoryBtn.addEventListener('click', loadHistory);
clearHistoryBtn.addEventListener('click', async () => {
  if (!confirm('Clear all prediction history? This cannot be undone.')) return;
  await fetch('/api/history', { method: 'DELETE' });
  loadHistory();
});

/* ------------------------------------------------------------
   Performance view
   ------------------------------------------------------------ */
const accuracyNumber = document.getElementById('accuracyNumber');
const cmContainer = document.getElementById('cmContainer');
const reportTableBody = document.querySelector('#reportTable tbody');

let performanceLoaded = false;

async function loadPerformance() {
  if (performanceLoaded) return;
  const res = await fetch('/api/performance');
  const data = await res.json();
  const report = data.report;

  accuracyNumber.textContent = (report.accuracy * 100).toFixed(2) + '%';

  if (data.confusion_matrix_url) {
    cmContainer.innerHTML = `<img src="${data.confusion_matrix_url}" alt="Confusion matrix">`;
  }

  const rowOrder = ['Glioma', 'Meningioma', 'Pituitary Tumor', 'No Tumor', 'macro avg', 'weighted avg'];
  reportTableBody.innerHTML = '';
  rowOrder.forEach(key => {
    if (!report[key]) return;
    const r = report[key];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${key}</td>
      <td>${r.precision.toFixed(4)}</td>
      <td>${r.recall.toFixed(4)}</td>
      <td>${r['f1-score'].toFixed(4)}</td>
      <td>${r.support}</td>
    `;
    reportTableBody.appendChild(tr);
  });

  performanceLoaded = true;
}
