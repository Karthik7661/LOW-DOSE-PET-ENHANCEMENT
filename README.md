# AI-Powered Low-Dose PET Image Enhancement Using Restormer

PETRestore is a premium, Capstone-level AI healthcare web application designed to enhance noisy low-dose PET (Positron Emission Tomography) scans using a Transformer-based deep learning architecture.

By utilizing a lightweight Restormer model trained on paired synthetic low-dose and reference scans, the system successfully filters out high-frequency Poisson noise while preserving critical boundary structures and clinical details necessary for diagnostic fidelity.

---

## 🚀 Key Features

* **PACS-like Workstation View**: A diagnostic dashboard showing Low-Dose input, Restormer Enhanced output, and Reference PET side-by-side.
* **Curtain Slider Comparison**: Interactive slider overlay to swipe before/after scan frames.
* **Voxel Zoom Magnifier Lens**: Circular magnifying glass tool that activates on hover to inspect restoration down to individual pixels.
* **PACS Adjustments**: Interactive brightness and contrast sliders using window leveling logic.
* **Clinical DICOM Attribute Explorer**: Metadata parser using `pydicom` to extract patient details, scan modality, estimated dose, and scanner parameters.
* **Developer REST API Sandbox**: Interactive tabs featuring code snippets in **cURL**, **Python**, and **JavaScript** to integrate the model with external hospital networks.

---

## 🛠️ Technology Stack

* **AI Model**: PyTorch, MONAI (Medical Open Network for AI), Einops
* **Backend**: Flask (Python)
* **Frontend**: HTML5, CSS3 (translucent glassmorphic panels), JavaScript (ES6)
* **Medical Libraries**: `pydicom`, `scikit-image`, `numpy`

---

## 📦 Local Installation & Setup

1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/Karthik7661/LOW-DOSE-PET-ENHANCEMENT.git
   cd LOW-DOSE-PET-ENHANCEMENT
   ```

2. Set up a virtual environment and install packages:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Launch the web application:
   ```bash
   python3 app.py
   ```
   Open `http://127.0.0.1:5001` in your browser.

---

## ⚡ Developer REST API Usage

### 1. Denoise scan using cURL:
```bash
curl -X POST \
  -F "file=@/path/to/scan.dcm" \
  http://127.0.0.1:5001/enhance
```

### 2. Python Requests Integration:
```python
import requests

url = "http://127.0.0.1:5001/enhance"
files = {"file": open("scan.dcm", "rb")}
response = requests.post(url, files=files)
data = response.json()
if data["success"]:
    print("Enhanced scan saved at:", data["enhanced_url"])
```

---

## 📋 Disclaimer
*This application is intended for research and educational purposes only and should not be used for clinical diagnosis or medical decision-making.*
