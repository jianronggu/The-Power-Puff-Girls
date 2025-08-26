import cv2
from typing import List
from google.cloud import vision
from masking import polygon_from_vision_vertices


def detect_faces(path: str) -> List:
    """Return a list of face polygons (np.ndarray Nx2 int32)."""
    client = vision.ImageAnnotatorClient()
    with open(path, "rb") as f:
        img_bytes = f.read()
    image = vision.Image(content=img_bytes)

    resp = client.face_detection(image=image)
    faces = resp.face_annotations or []
    if resp.error.message:
        raise Exception(
            f"{resp.error.message}\nFor more info: https://cloud.google.com/apis/design/errors"
        )

    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not read image: {path}")
    h, w = img.shape[:2]

    polys = []
    for f in faces:
        verts = f.fd_bounding_poly.vertices or f.bounding_poly.vertices
        poly = polygon_from_vision_vertices(verts, w, h)
        polys.append(poly)
    return polys
