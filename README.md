# The-Power-Puff-Girls
Tiktok TechJam 2025

#  GeoShield: AI-Powered Location Privacy for Images

An AI-for-Privacy tool that detects and masks location-revealing content in images to protect user privacy.

Built for the **Privacy Meets AI: Building a Safer Digital Future** hackathon.

---
## Overview

As generative AI systems like OpenAI’s GPT-4o become increasingly adept at deducing the geographic location of an image, even from subtle visual cues, our project tackles the **privacy threat posed by inadvertent location disclosure**.

**GeoShield** analyzes uploaded images to:
- Detect visual cues like license plates, road signs etc.
- Identify high-risk regions using AI models
- Mask or inpaint these regions using tools like LaMa 
- Return a privacy-enhanced image that preserves aesthetics while obscuring identifiable features

---

## Problem Statement

> **GenAI Location Privacy**  
Build an app that allows users to upload an image and analyzes whether it contains visual cues that could be used to infer the geographic location where it was taken.  
It should also support automatic masking or noise injection for regions with high location-revealing information.

---

## Features

-  AI-powered detection of location-revealing cues
-  On-device image anonymization (text, logos etc.)
-  Seamless inpainting to preserve visual quality
-  No cloud uploads — all privacy-sensitive processing is done locally or securely

---

## 🧪 Demo

📺 [Watch Demo (2m30s)](https://youtube.com/your-demo-video)

Screenshots:
- Input:  
  ![input](examples/sample_input.jpg)
- Output:  
  ![output](examples/sample_output.jpg)

---

## ⚙️ How It Works

1.  **Detection**  
   - Uses AI models like:
     - `Google Cloud Vision API` for OCR & logo detection

2.  **Masking/Inpainting**  
   - Generates polygon masks over detected features
   - Applies **LaMa (simple-lama-inpainting)** for seamless fill-in

3.  **Output**  
   - Saves the cleaned image and mask for verification
   - Optionally shows side-by-side comparison

---

## 🛠️ Tech Stack

| Tool               | Purpose                           |
|--------------------|-----------------------------------|
| Python             | Core backend                      |
| FastAPI (optional) | Web interface                     |
| Google Cloud Vision| OCR & Logo detection              |
| simple-lama-inpainting | Region inpainting          |

---

## 🔧 Setup Instructions

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
2. [Set up Google Cloud Vision](https://cloud.google.com/vision/docs/ocr)

