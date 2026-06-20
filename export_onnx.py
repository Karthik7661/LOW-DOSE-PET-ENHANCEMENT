import os
import torch
import numpy as np
from model import Restormer

print("[*] Initializing Restormer for ONNX export...")
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
if not os.path.exists(model_path):
    print(f"[-] Error: Weights file '{model_path}' not found!")
    exit(1)

# Load weights
checkpoint = torch.load(model_path, map_location='cpu')
model.load_state_dict(checkpoint)
model.eval()
print("[+] Weights loaded successfully.")

# Create dummy input of shape [batch_size, channels, height, width]
dummy_input = torch.randn(1, 1, 200, 200, dtype=torch.float32)

onnx_path = 'best_restormer_pet.onnx'
print(f"[*] Exporting model to {onnx_path}...")

torch.onnx.export(
    model,
    dummy_input,
    onnx_path,
    export_params=True,
    opset_version=11,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

if os.path.exists(onnx_path):
    print(f"[+] ONNX export SUCCESS: {onnx_path} created successfully ({os.path.getsize(onnx_path) / 1024 / 1024:.2f} MB)")
else:
    print("[-] Error: ONNX file creation failed.")
