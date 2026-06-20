import os
import numpy as np
import pydicom
import torch
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
from monai.transforms import Compose, ScaleIntensity, EnsureType

# Import Restormer model from model.py
from model import Restormer

app = Flask(__name__)

# Detect if running in Vercel Serverless environment
IS_VERCEL = 'VERCEL' in os.environ

if IS_VERCEL:
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
    app.config['OUTPUT_FOLDER'] = '/tmp/outputs'
else:
    app.config['UPLOAD_FOLDER'] = 'static/uploads'
    app.config['OUTPUT_FOLDER'] = 'static/outputs'

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
os.makedirs('static/images', exist_ok=True)

# Device Configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"[*] Utilizing device: {device}")

# Load Restormer model
print("[*] Initializing Restormer model...")
model = Restormer(
    inp_channels=1,
    out_channels=1,
    dim=24,
    num_blocks=[2, 2, 2, 2],
    num_refinement_blocks=2,
    heads=[1, 2, 2, 4],
    ffn_expansion_factor=2.0,
    bias=False,
    LayerNorm_type="WithBias",
    dual_pixel_task=False
)

model_path = 'best_restormer_pet.pth'
if os.path.exists(model_path):
    try:
        checkpoint = torch.load(model_path, map_location=device)
        model.load_state_dict(checkpoint)
        print("[+] Model weights loaded successfully!")
    except Exception as e:
        print(f"[-] Error loading model weights: {e}")
else:
    print(f"[-] WARNING: Weights file '{model_path}' not found. Inference will run on random initialization.")

model.to(device)
model.eval()

# MONAI Preprocessing Transforms
monai_transform = Compose([
    ScaleIntensity(),
    EnsureType()
])

def process_dicom(path):
    """Load DICOM PET image and normalize to [0,1]."""
    ds = pydicom.dcmread(path)
    img = ds.pixel_array.astype(np.float32)
    img = img - img.min()
    img = img / (img.max() + 1e-8)
    return img

def process_image(path):
    """Load standard image, convert to grayscale and normalize to [0,1]."""
    img_pil = Image.open(path).convert('L')
    img = np.array(img_pil).astype(np.float32)
    img = img / 255.0
    return img

def resize_image(img, target_shape=(200, 200)):
    """Resize image to target shape (200x200) for the Restormer model."""
    img_pil = Image.fromarray((img * 255.0).clip(0, 255).astype(np.uint8))
    img_pil = img_pil.resize(target_shape, Image.Resampling.BILINEAR)
    return np.array(img_pil).astype(np.float32) / 255.0

def extract_dicom_metadata(path):
    """Extract clinical header metadata from DICOM file."""
    try:
        ds = pydicom.dcmread(path)
        metadata = {
            'PatientID': getattr(ds, 'PatientID', 'PET-ANON-9482'),
            'StudyDate': getattr(ds, 'StudyDate', '2026-06-20'),
            'Modality': getattr(ds, 'Modality', 'PT'),
            'Manufacturer': getattr(ds, 'Manufacturer', 'SIEMENS'),
            'StationName': getattr(ds, 'StationName', 'PET-CT_BIOGRAPH'),
            'RescaleSlope': str(getattr(ds, 'RescaleSlope', '1.0')),
            'RescaleIntercept': str(getattr(ds, 'RescaleIntercept', '0.0')),
            'ScannerVoltage': f"{getattr(ds, 'KVP', '120')} kVp",
            'EstimatedDose': '1.8 mSv (Low-Dose Mode)'
        }
        return metadata
    except Exception as e:
        print(f"[-] Error parsing DICOM metadata: {e}")
        return get_mock_metadata('error.dcm')

def get_mock_metadata(filename):
    """Return simulated clinical metadata for non-DICOM uploads."""
    return {
        'PatientID': 'PET-TRIAL-085',
        'StudyDate': '2026-06-20',
        'Modality': 'PT (PET Scan)',
        'Manufacturer': 'GE MEDICAL SYSTEMS',
        'StationName': 'DISCOVERY_MI_PETCT',
        'RescaleSlope': '1.0',
        'RescaleIntercept': '0.0',
        'ScannerVoltage': '120 kVp',
        'EstimatedDose': '1.5 mSv (Simulated Low-Dose Scan)'
    }

def calculate_snr(img):
    """Calculate the Signal-to-Noise Ratio of a grayscale slice."""
    mean_val = np.mean(img)
    std_val = np.std(img)
    if std_val < 1e-6:
        return 0.0
    return float(mean_val / std_val)

def simulate_low_dose(img, reduction_factor=10):
    """Generate synthetic low-dose PET using Poisson noise."""
    img = img.astype(np.float32)
    img = img / (img.max() + 1e-8)

    counts = img * 1000.0
    counts = counts / reduction_factor

    noisy_counts = np.random.poisson(counts)

    low_img = noisy_counts / (1000.0 / reduction_factor)
    low_img = np.clip(low_img, 0, 1)

    return low_img

def generate_synthetic_pet():
    """Generates a synthetic brain PET phantom with low-dose Poisson noise."""
    sample_low_path = 'static/images/sample_low_dose.png'
    sample_high_path = 'static/images/sample_high_dose.png'
    
    if os.path.exists(sample_low_path) and os.path.exists(sample_high_path):
        return

    print("[*] Generating synthetic PET brain phantoms for demonstration...")
    size = 200
    x = np.linspace(-1, 1, size)
    y = np.linspace(-1, 1, size)
    X, Y = np.meshgrid(x, y)
    
    ellipse = (X**2 / 0.65**2) + (Y**2 / 0.8**2)
    brain_mask = ellipse < 1.0
    
    clean_brain = np.zeros((size, size))
    clean_brain[brain_mask] = 0.2
    
    v1 = ((X - 0.15)**2 / 0.12**2) + ((Y - 0.1)**2 / 0.25**2) < 1.0
    v2 = ((X + 0.15)**2 / 0.12**2) + ((Y - 0.1)**2 / 0.25**2) < 1.0
    clean_brain[v1] = 0.05
    clean_brain[v2] = 0.05
    
    hotspots = [
        (0.0, 0.4, 0.12, 0.75),
        (0.3, -0.2, 0.1, 0.8),
        (-0.3, -0.2, 0.1, 0.8),
        (0.18, -0.05, 0.07, 0.9),
        (-0.18, -0.05, 0.07, 0.9),
        (0.0, -0.5, 0.15, 0.7)
    ]
    
    for hx, hy, r, val in hotspots:
        dist = np.sqrt((X - hx)**2 + (Y - hy)**2)
        blob = np.exp(- (dist**2) / (2 * r**2))
        clean_brain = np.maximum(clean_brain, blob * val)
        
    clean_brain = clean_brain * brain_mask
    
    clean_brain = clean_brain - clean_brain.min()
    clean_brain = clean_brain / (clean_brain.max() + 1e-8)
    
    reduction_factor = 10.0
    counts = clean_brain * 1000.0 / reduction_factor
    noisy_counts = np.random.poisson(counts)
    noisy_brain = noisy_counts / (1000.0 / reduction_factor)
    noisy_brain = np.clip(noisy_brain, 0, 1)
    
    plt.imsave(sample_high_path, clean_brain, cmap='gray')
    plt.imsave(sample_low_path, noisy_brain, cmap='gray')
    print("[+] Synthetic PET brain phantoms generated successfully!")

# Generate phantoms on launch
generate_synthetic_pet()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/static/uploads/<filename>')
def serve_uploads(filename):
    if IS_VERCEL:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    else:
        return send_from_directory(os.path.join(app.root_path, 'static/uploads'), filename)

@app.route('/static/outputs/<filename>')
def serve_outputs(filename):
    if IS_VERCEL:
        return send_from_directory(app.config['OUTPUT_FOLDER'], filename)
    else:
        return send_from_directory(os.path.join(app.root_path, 'static/outputs'), filename)

@app.route('/enhance', methods=['POST'])
def enhance():
    is_sample = request.form.get('is_sample', 'false') == 'true'
    reduction_factor = float(request.form.get('reduction_factor', '10'))
    
    if is_sample:
        filename = 'sample_low_dose.png'
        # Load high-dose reference scan to simulate custom noise dynamically
        upload_path = 'static/images/sample_high_dose.png'
    else:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        filename = secure_filename(file.filename)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
    try:
        # Load high-dose reference image depending on type
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.dcm':
            img_ref = process_dicom(upload_path)
            metadata = extract_dicom_metadata(upload_path)
        else:
            img_ref = process_image(upload_path)
            metadata = get_mock_metadata(filename)
            
        # Simulate Low-Dose PET with custom Poisson noise reduction factor
        img_low = simulate_low_dose(img_ref, reduction_factor=reduction_factor)
        
        # Resize low-dose and reference to model dimensions (200, 200)
        img_low = resize_image(img_low, (200, 200))
        img_ref_resized = resize_image(img_ref, (200, 200))
        
        # Save low-dose input preview in PNG format
        preview_filename = 'preview_' + os.path.splitext(filename)[0] + '.png'
        preview_path = os.path.join(app.config['UPLOAD_FOLDER'], preview_filename)
        plt.imsave(preview_path, img_low, cmap='gray')
        
        # Save reference ground truth preview in PNG format
        ref_filename = 'ref_' + os.path.splitext(filename)[0] + '.png'
        ref_path = os.path.join(app.config['UPLOAD_FOLDER'], ref_filename)
        plt.imsave(ref_path, img_ref_resized, cmap='gray')
        
        # Calculate Input Image Quality Metric (SNR)
        input_snr = calculate_snr(img_low)
        
        # Preprocess with MONAI
        img_tensor = monai_transform(img_low)
        img_tensor = torch.as_tensor(img_tensor, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        
        # Run Restormer inference
        with torch.no_grad():
            enhanced_tensor = model(img_tensor)
            
        enhanced_np = enhanced_tensor[0, 0].cpu().numpy()
        enhanced_np = np.clip(enhanced_np, 0, 1)
        
        # Calculate Output Image Quality Metric (SNR)
        enhanced_snr = calculate_snr(enhanced_np)
        
        # Calculate SNR Denoising Gain (improvement percentage)
        snr_improvement = 0.0
        if input_snr > 0:
            snr_improvement = ((enhanced_snr - input_snr) / input_snr) * 100.0
            
        # Save enhanced output image
        output_filename = 'enhanced_' + os.path.splitext(filename)[0] + '.png'
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        plt.imsave(output_path, enhanced_np, cmap='gray')
        
        # Update metadata description with selected reduction factor
        metadata['EstimatedDose'] = f"{2.0 / (reduction_factor / 10.0):.2f} mSv ({int(reduction_factor)}x Dose Reduction)"
        
        return jsonify({
            'success': True,
            'preview_url': '/static/uploads/' + preview_filename,
            'enhanced_url': '/static/outputs/' + output_filename,
            'reference_url': '/static/uploads/' + ref_filename if not is_sample else '/static/images/sample_high_dose.png',
            'filename': filename,
            'metadata': metadata,
            'metrics': {
                'input_snr': f"{input_snr:.4f}",
                'enhanced_snr': f"{enhanced_snr:.4f}",
                'snr_improvement': f"{snr_improvement:.2f}%"
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
