# GeoShield & FaceShield: AI-Powered Image Privacy Toolkit

**Hackathon Submission for:** *Privacy Meets AI: Building a Safer Digital Future (TikTok TechJam 2025)*  
**Team Project Title:** GeoShield & FaceShield  
**GitHub Repo:** [github.com/yourteam/GeoShield-FaceShield](https://github.com/yourteam/GeoShield-FaceShield)  
**Demo Video (YouTube):** [Watch Demo](https://youtube.com/your-demo-video)

---

## Overview

Modern GenAI models can infer who and where from just a photo. Our project protects user privacy through:

- **GeoShield**: Automatically detects and masks location-revealing content like license plates, logos, and road signs using AI + inpainting.
- **FaceShield**: A local photo gallery app that auto-blurs faces and allows secure per-image or global unmasking.

We follow a **privacy-first philosophy**: all sensitive content is masked by default and stays on your device.

---

## Problem Statement

**GenAI Location Privacy**  
Develop a system that detects visual cues in images that could leak location data (e.g., signage, architecture, license plates) and automatically masks these regions to preserve user privacy.

---

## Features

### GeoShield
- AI-powered detection of location cues (text, logos, signs)
- Generates masks using Google Vision, YOLO, SAM, or CLIP
- Cleans images via seamless inpainting (LaMa)
- All processing is local or securely sandboxed

### FaceShield
- Upload photos and automatically blur faces (OpenCV Haar)
- Privacy-first gallery shows only masked versions
- Unlock a single image or an entire session via password
- Edit blur strength, toggle regions, and delete photos safely
- EXIF/GPS metadata is stripped from saved files

---

## Tech Stack

| Tool / Library              | Purpose                            |
|-----------------------------|------------------------------------|
| Python                      | Backend logic                      |
| OpenCV                      | Face & object detection            |
| Google Cloud Vision API     | OCR & logo detection               |
| simple-lama-inpainting      | Image inpainting (GeoShield)       |
| FastAPI                     | Web API for GeoShield              |
| Pillow / NumPy              | Image manipulation                 |

---

## Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```
### 2. Set Up Google Cloud Vision
- Enable the Cloud Vision API in your GCP project
- Create a service account and download the JSON key
- Set the environment variable:
3. Run the Applications

### 3.GeoShield (Location Privacy Backend)
```bash
cd backend
uvicorn main:app --reload
```

### 4.FaceShield (Frontend Gallery)
```bash
cd frontend
npm install
npm run dev
```



