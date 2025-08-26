import cv2
import numpy as np
from typing import List
from google.cloud import vision

def detect_landmark_regions(path: str) -> List[np.ndarray]:
    """Return polygons for landmark bounding boxes."""
    client = vision.ImageAnnotatorClient()
    
    with open(path, "rb") as f:
        content = f.read()
    image = vision.Image(content=content)

    resp = client.landmark_detection(image=image)
    landmarks = resp.landmark_annotations or []
    
    if resp.error.message:
        raise Exception(
            f"{resp.error.message}\nFor more info: https://cloud.google.com/apis/design/errors"
        )

    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not read image: {path}")
    h, w = img.shape[:2]

    polys = []
    for landmark in landmarks:
        # Convert normalized vertices to pixel coordinates
        vertices = landmark.bounding_poly.vertices
        if vertices:
            # Convert from Vision API format to polygon coordinates
            pts = []
            for vertex in vertices:
                x = vertex.x if hasattr(vertex, 'x') else vertex.x * w
                y = vertex.y if hasattr(vertex, 'y') else vertex.y * h
                pts.append([int(x), int(y)])
            polys.append(np.array(pts, dtype=np.int32))
    
    return polys