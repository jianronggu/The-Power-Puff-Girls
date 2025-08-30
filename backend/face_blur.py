import os
import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageOps

MAX_SIDE = 2000  # Downscale large images for performance

def detect_faces(img: Image.Image):
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(24, 24))
    return [(x, y, w, h) for (x, y, w, h) in faces]

def blur_region(cv_img, x, y, w, h, strength):
    k = max(3, strength | 1)
    roi = cv_img[y:y+h, x:x+w]
    cv_img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k, k), 0)

def pil_load_and_normalize(file_path):
    img = Image.open(file_path).convert("RGB")
    img = ImageOps.exif_transpose(img)
    scale = min(1.0, MAX_SIDE / max(img.size))
    if scale < 1.0:
        img = img.resize((int(img.width*scale), int(img.height*scale)), Image.LANCZOS)
    return img

def blur_face(input_path: str, out_dir: str = "output/",):
    img = pil_load_and_normalize(input_path)
    base = Path(input_path).stem
    out_path = str(Path(out_dir) / f"{base}_blurred.png")
    strength = 21
    faces = detect_faces(img)
    if not faces:
        print("No faces detected.")
        return

    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    for (x, y, w, h) in faces:
        blur_region(cv_img, x, y, w, h, strength)
        overlay = cv_img.copy()
        cv2.rectangle(overlay, (x, y), (x+w, y+h), (0, 0, 0), thickness=-1)
        cv_img = cv2.addWeighted(overlay, 0.15, cv_img, 0.85, 0)

    output_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    output_img.save(out_path, "JPEG", quality=92)
    print(f"Saved blurred image to {out_path}")
    return out_path  # <-- Add this line

