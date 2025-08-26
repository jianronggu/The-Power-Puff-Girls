import argparse
import cv2
from masking import make_mask, blur_with_mask, solid_fill_with_mask
from face import detect_faces
from text import detect_text_polygons
from landmark import detect_landmark_regions
import argparse
import cv2
from masking import make_mask, blur_with_mask, solid_fill_with_mask, noise_injection_with_mask, pixelation_with_mask

def main():
    p = argparse.ArgumentParser(description="Detect faces/text/landmarks and apply privacy protection.")
    p.add_argument("input", help="Path to input image")
    p.add_argument("-o", "--output", default="protected.png", help="Output image path")
    p.add_argument("--mask-out", default=None, help="Optional path to save mask.png")
    p.add_argument("--blur", type=int, default=91, help="Gaussian kernel size (odd)")
    p.add_argument("--pad", type=int, default=12, help="Pad mask by N pixels (dilate)")
    p.add_argument(
        "--include",
        choices=["faces", "text", "landmarks", "all"],   
        default="all",                                   
        help="What to protect",
    )
    p.add_argument("--method", choices=["blur", "solid", "noise", "pixelate"], 
                  default="blur", help="Protection method")
    p.add_argument("--noise-strength", type=int, default=50, 
                  help="Noise strength (0-255) for noise injection method")
    p.add_argument("--pixel-size", type=int, default=8, 
                  help="Pixel size for pixelation method")
    
    args = p.parse_args()

    img = cv2.imread(args.input)
    if img is None:
        raise SystemExit(f"Cannot read {args.input}")

    polygons = []
    if args.include in ("faces", "all"):
        polygons += detect_faces(args.input)                      
    if args.include in ("text", "all"):
        polygons += detect_text_polygons(args.input, skip_full=True, min_chars=1)
    if args.include in ("landmarks", "all"):
        polygons += detect_landmark_regions(args.input)

    if not polygons:
        print("No regions detected; copying input to output.")
        cv2.imwrite(args.output, img)
        return

    mask = make_mask(polygons, img.shape, pad_px=args.pad)
    
    # Apply the selected protection method
    if args.method == "solid":
        protected = solid_fill_with_mask(img, mask)
    elif args.method == "noise":
        protected = noise_injection_with_mask(img, mask, args.noise_strength)
    elif args.method == "pixelate":
        protected = pixelation_with_mask(img, mask, args.pixel_size)
    else:  # default to blur
        ksize = args.blur if args.blur % 2 else args.blur + 1
        protected = blur_with_mask(img, mask, ksize=ksize)

    cv2.imwrite(args.output, protected)
    if args.mask_out:
        cv2.imwrite(args.mask_out, mask)
    print(f"Saved protected image → {args.output}")
    if args.mask_out:
        print(f"Saved mask → {args.mask_out}")

if __name__ == "__main__":
    main()