import cv2
from typing import List
from google.cloud import vision
from masking import polygon_from_vision_vertices


def detect_text_polygons(path: str, *, skip_full: bool = True, min_chars: int = 1) -> List:
    """Return polygons for text elements. Skips the first full-page node by default."""
    client = vision.ImageAnnotatorClient()
    with open(path, "rb") as f:
        content = f.read()
    image = vision.Image(content=content)

    resp = client.text_detection(image=image)
    anns = resp.text_annotations or []
    if resp.error.message:
        raise Exception(
            f"{resp.error.message}\nFor more info: https://cloud.google.com/apis/design/errors"
        )

    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not read image: {path}")
    h, w = img.shape[:2]

    polys = []
    for idx, t in enumerate(anns):
        if skip_full and idx == 0:
            continue
        if len((t.description or "").strip()) < min_chars:
            continue
        poly = polygon_from_vision_vertices(t.bounding_poly.vertices, w, h)
        polys.append(poly)
    return polys
