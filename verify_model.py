import sys
import os

print("[*] Running Restormer Model & Weights Verification...")

# Check that model file exists
if not os.path.exists("model.py"):
    print("[-] Error: model.py not found!")
    sys.exit(1)

# Check that weights file exists
if not os.path.exists("best_restormer_pet.pth"):
    print("[-] Error: best_restormer_pet.pth not found!")
    sys.exit(1)

try:
    import torch
    import numpy as np
    from model import Restormer
    print("[+] PyTorch and model imported successfully.")
except ImportError as e:
    print(f"[-] ImportError: {e}. Are you running this script inside the venv?")
    sys.exit(1)

try:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[+] Device selected: {device}")
    
    # Initialize model
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
    print("[+] Model initialized successfully.")
    
    # Load weights
    checkpoint = torch.load("best_restormer_pet.pth", map_location=device)
    model.load_state_dict(checkpoint)
    model.to(device)
    model.eval()
    print("[+] Model weights loaded successfully from best_restormer_pet.pth.")
    
    # Run a mock inference forward pass
    # Input tensor shape: [batch_size, channels, height, width] -> [1, 1, 200, 200]
    mock_input = torch.rand((1, 1, 200, 200), dtype=torch.float32).to(device)
    
    with torch.no_grad():
        mock_output = model(mock_input)
        
    print(f"[+] Forward pass complete.")
    print(f"[+] Input shape: {mock_input.shape}")
    print(f"[+] Output shape: {mock_output.shape}")
    
    # Assert dimensions
    assert mock_output.shape == (1, 1, 200, 200), "Shape mismatch: Output shape must match input shape (1, 1, 200, 200)"
    print("[+] Verification verification: SUCCESS!")
    sys.exit(0)

except Exception as e:
    print(f"[-] Verification failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
