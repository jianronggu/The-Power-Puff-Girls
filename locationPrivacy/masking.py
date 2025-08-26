import cv2
import numpy as np
from typing import Sequence, Tuple

Polygon = np.ndarray  # (N, 2) int32


def polygon_from_vision_vertices(verts, w: int, h: int) -> Polygon:
    """Clamp Vision vertices to image bounds and return (N,2) int32 polygon."""
    pts = []
    for v in verts:
        x = max(0, min(w - 1, int(v.x)))
        y = max(0, min(h - 1, int(v.y)))
        pts.append((x, y))
    return np.array(pts, dtype=np.int32)


def make_mask(polygons: Sequence[Polygon], image_shape: Tuple[int, int, int], pad_px: int = 12) -> np.ndarray:
    """Fill polygons into a single HxW uint8 mask and dilate by pad_px for safety."""
    h, w = image_shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    for poly in polygons:
        if poly is None or poly.size == 0:
            continue
        cv2.fillPoly(mask, [poly.astype(np.int32)], 255)
    if pad_px > 0:
        k = 2 * pad_px + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        mask = cv2.dilate(mask, kernel, iterations=1)
    return mask


def blur_with_mask(image: np.ndarray, mask: np.ndarray, ksize: int = 91) -> np.ndarray:
    """Apply a single global Gaussian blur and composite only where mask==255."""
    if ksize % 2 == 0:
        ksize += 1
    blurred = cv2.GaussianBlur(image, (ksize, ksize), 0)
    out = image.copy()
    out[mask == 255] = blurred[mask == 255]
    return out


def solid_fill_with_mask(image: np.ndarray, mask: np.ndarray, value=(0, 0, 0)) -> np.ndarray:
    """Safer than blur for high-risk cues (plates/QR/URLs)."""
    out = image.copy()
    out[mask == 255] = value
    return out


def noise_injection_with_mask(image: np.ndarray, mask: np.ndarray, noise_strength: int = 50) -> np.ndarray:
    """
    Apply noise injection to masked regions.
    
    Args:
        image: Input image
        mask: Binary mask where 255 indicates regions to noise
        noise_strength: Strength of noise (0-255)
    
    Returns:
        Image with noise injected in masked regions
    """
    out = image.copy()
    
    # Get the masked region coordinates
    y_coords, x_coords = np.where(mask == 255)
    
    if len(y_coords) > 0:
        # Generate random noise for each channel
        noise = np.random.randint(-noise_strength, noise_strength + 1, 
                                 (len(y_coords), 3), dtype=np.int16)
        
        # Apply noise to the masked region
        noisy_pixels = out[y_coords, x_coords].astype(np.int16) + noise
        noisy_pixels = np.clip(noisy_pixels, 0, 255).astype(np.uint8)
        
        out[y_coords, x_coords] = noisy_pixels
    
    return out


def pixelation_with_mask(image: np.ndarray, mask: np.ndarray, pixel_size: int = 8) -> np.ndarray:
    """
    Apply pixelation to masked regions.
    
    Args:
        image: Input image
        mask: Binary mask where 255 indicates regions to pixelate
        pixel_size: Size of the pixels (larger = more pixelated)
    
    Returns:
        Image with pixelated masked regions
    """
    out = image.copy()
    
    if pixel_size < 2:
        pixel_size = 2
    
    # Get bounding box of masked region
    y_coords, x_coords = np.where(mask == 255)
    if len(y_coords) == 0:
        return out
    
    y_min, y_max = np.min(y_coords), np.max(y_coords)
    x_min, x_max = np.min(x_coords), np.max(x_coords)
    
    # Extract the masked region
    roi = out[y_min:y_max+1, x_min:x_max+1]
    
    if roi.size == 0:
        return out
    
    # Downsample and upsample for pixelation effect
    small = cv2.resize(roi, (max(1, (x_max - x_min + 1) // pixel_size), 
                            max(1, (y_max - y_min + 1) // pixel_size)), 
                      interpolation=cv2.INTER_NEAREST)
    pixelated = cv2.resize(small, (x_max - x_min + 1, y_max - y_min + 1), 
                          interpolation=cv2.INTER_NEAREST)
    
    # Apply pixelation only to the masked area within the ROI
    roi_mask = mask[y_min:y_max+1, x_min:x_max+1]
    roi[roi_mask == 255] = pixelated[roi_mask == 255]
    
    return out