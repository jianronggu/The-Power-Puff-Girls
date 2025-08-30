import os 
from pathlib import Path 
import cv2
import numpy as np 
from google.cloud import vision 
from PIL import Image 
from simple_lama_inpainting import SimpleLama  

def _to_polys(annos, w, h, skip_first=False): 
    """Google Vision -> list of Nx2 int32 polygons (clamped to image).""" 
    if not annos: 
        return [] 
    polys, start = [], (1 if skip_first else 0)
    for a in annos[start:]: 
        bp = getattr(a, "bounding_poly", None) 
        if not bp or not bp.vertices:
            continue 
        pts = [] 
        for v in bp.vertices: 
            x = max(0, min(w - 1, int(getattr(v, "x", 0) or 0))) 
            y = max(0, min(h - 1, int(getattr(v, "y", 0) or 0))) 
            pts.append([x, y]) 
        if len(pts) >= 3:
            polys.append(np.array(pts, dtype=np.int32)) 
    return polys

def _dilate(mask_u8, pad_px): 
    if pad_px <= 0:
        return mask_u8 
    k = 2 * pad_px + 1 
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)) 
    return cv2.dilate(mask_u8, kernel)

def remove_text_and_logos(
    image_path: str,
    out_dir: str = "output/",
    include_full_text: bool = False,  # Vision's first element = page box
    pad_px: int = 6
): 
    """
    1) Google Vision: OCR + Logos
    2) Build single mask (texts + logos) with uniform dilation
    3) Inpaint with SimpleLaMa
    Returns (clean_image_path, mask_path)
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    image_path = str(image_path)
    base = Path(image_path).stem
    mask_path = str(Path(out_dir) / f"{base}_mask.png")
    out_path = str(Path(out_dir) / f"{base}_inpainted.png")

    # Load once to get size
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(image_path)
    h, w = img.shape[:2]

    # ---- Vision: one client, two calls
    client = vision.ImageAnnotatorClient()
    with open(image_path, "rb") as f:
        content = f.read()
    gimg = vision.Image(content=content)

    ocr = client.text_detection(image=gimg).text_annotations
    logos = client.logo_detection(image=gimg).logo_annotations

    # ---- Build mask
    mask = np.zeros((h, w), dtype=np.uint8)
    text_polys = _to_polys(ocr, w, h, skip_first=not include_full_text)
    logo_polys = _to_polys(logos, w, h, skip_first=False)

    if text_polys:
        cv2.fillPoly(mask, text_polys, 255)
    if logo_polys:
        cv2.fillPoly(mask, logo_polys, 255)

    if np.any(mask):
        mask = _dilate(mask, pad_px)
        cv2.imwrite(mask_path, mask)

        # ---- LaMa inpaint
        lama = SimpleLama()
        result = lama(Image.open(image_path), Image.fromarray(mask).convert("L"))
        result.save(out_path)
        return out_path, mask_path
    else:
        # Nothing to remove
        return image_path, None
