The-Power-Puff-Girls

Tiktok TechJam 2025

GeoShield & FaceShield: AI-Powered Privacy for Images

An AI-for-Privacy toolkit that detects and masks face/location-revealing content in images to protect user privacy.

Built for Privacy Meets AI: Building a Safer Digital Future.

Overview

Modern GenAI can infer a photo’s where and who from tiny visual cues. This repo ships two complementary protections:

GeoShield — detects location-revealing cues (e.g., street signs, plates, logos) and masks or inpaints them.

FaceShield — a local photo gallery that auto-blurs faces by default, lets you reveal/unblur when permitted, and supports per-photo or global unlock + one-click delete.

Features
GeoShield

AI detection of location-revealing regions (plates, road signs, logos).

Heatmap/mask high-risk zones; LaMa inpainting for clean results.

Local/secure processing flow.

FaceShield (NEW: Blur Image + Gallery)

Image upload → auto-blur faces (OpenCV Haar cascade).

Gallery view shows masked copies by default (privacy-first).

Per-photo reveal (enter password to view just that original) or Global unlock (show all originals for the session).

Edit / Blur: toggle regions, add manual boxes, adjust blur strength, save masked.

Delete with confirmation (removes files + metadata).

EXIF/GPS stripped on save; dedupe by content hash to prevent accidental duplicates.

🧪 Demo

📺 Watch Demo (2m30s) – link your video
Screenshots:

Input:


Output:


⚙️ How It Works
GeoShield

Detection

OCR & logo detection (e.g., Google Cloud Vision API) to flag location cues.

Masking / Inpainting

Generate polygon masks over risky regions.

Use LaMa (simple-lama-inpainting) for seamless fills.

Output

Save cleaned image + mask; optional side-by-side comparison.

FaceShield

Upload

User adds photos to the local gallery.

Auto-Blur

Faces detected (OpenCV Haar cascade) ⇒ blurred by default.

View / Unlock

Gallery shows masked copies.

Enter password to:

Reveal a single photo (per-photo permission), or

Globally unlock for the session.

Edit

Toggle per-region hide/show, add manual boxes, adjust blur strength, save masked.

Delete

Confirm to remove the photo and its metadata from disk.

🛠️ Tech Stack
Tool / Lib	Purpose
Python	Core
Streamlit	FaceShield UI (local gallery)
OpenCV	Face detection / blurring
Pillow, NumPy	Image ops
Google Cloud Vision	(GeoShield) OCR & logo detection
simple-lama-inpainting	(GeoShield) seamless inpainting
🔧 Setup Instructions
1) Install dependencies
pip install -r requirements.txt


For FaceShield only:

pip install streamlit opencv-python pillow numpy

2) GeoShield (location privacy)

Set up Google Cloud Vision
.

Configure credentials and run the GeoShield script/service (see geoshield/ directory if you split modules).

3) FaceShield (blur image + gallery)

Place the app at repo root (or apps/faceshield/) as image_privacy_gallery_local.py, then:

streamlit run image_privacy_gallery_local.py


Default behavior

Upload images → they’re stored in ./gallery/.

Gallery cards show masked versions.

Click View to open a photo; enter password to reveal this photo only.

Or set a sidebar password and click Unlock to show all originals for the session.

Click Edit / Blur to tweak masks/strength and Save masked.

Click Delete (type DELETE to confirm) to remove from disk + index.

Notes
• Images are re-encoded; EXIF/GPS is stripped.
• The uploader dedupes by content hash to avoid accidental duplicates.

🔐 Security / Ethics

Privacy-first defaults: masked content is what shows publicly.

No re-identification: do not attempt to reverse, deanonymize, or bypass masks.

Data hygiene: EXIF/GPS is stripped; originals stay local; deletes are permanent.

Model limits: face detection can miss/false-positive; always review before sharing.

🗺️ Roadmap

OCR-based redaction (names/plates) for FaceShield.

WebGPU/WebAssembly acceleration for on-device inpainting.

Soft-delete “Recycle Bin” with restore.

Batch processing & folder ingest.

License

MIT (adjust as needed).

Acknowledgements

LaMa / simple-lama-inpainting

OpenCV

Streamlit

Google Cloud Vision

Quick Start (FaceShield TL;DR)
pip install streamlit opencv-python pillow numpy
streamlit run image_privacy_gallery_local.py
# Upload → masked gallery. View to reveal per photo or Unlock globally.
