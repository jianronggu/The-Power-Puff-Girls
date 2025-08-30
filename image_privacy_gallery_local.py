
import io
import os
import json
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple
from pathlib import Path

import numpy as np
import streamlit as st
from PIL import Image, ImageOps
import cv2

# ---------------------------- Config & Paths ----------------------------

APP_TITLE = "🔒 Image Privacy Gallery (Blur, View, Delete)"
# Store alongside the script for portability
GALLERY_DIR = Path("gallery")
INDEX_PATH = GALLERY_DIR / "index.json"
MAX_SIDE = 2000  # downscale large uploads for performance

st.set_page_config(page_title="Image Privacy Gallery", page_icon="🖼️", layout="wide")

# ---------------------------- Utilities ----------------------------

def compute_image_hash(img):
    import io, hashlib
    buf = io.BytesIO()
    # normalize via JPEG to keep orientation/resize identical with saved original
    img.save(buf, format="JPEG", quality=95)
    return hashlib.sha256(buf.getvalue()).hexdigest()


def ensure_dirs():
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    if not INDEX_PATH.exists():
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump({"items": []}, f, indent=2)

def load_index() -> Dict[str, Any]:
    ensure_dirs()
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_index(idx: Dict[str, Any]):
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=2)

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def pil_load_and_normalize(file) -> Image.Image:
    img = Image.open(file).convert("RGB")
    img = ImageOps.exif_transpose(img)  # honor EXIF orientation
    scale = min(1.0, MAX_SIDE / max(img.size))
    if scale < 1.0:
        img = img.resize((int(img.width*scale), int(img.height*scale)), Image.LANCZOS)
    return img

def detect_faces(img: Image.Image) -> List[Tuple[int,int,int,int]]:
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(24, 24))
    return [(int(x), int(y), int(w), int(h)) for (x,y,w,h) in faces]

def blur_region(cv_img: np.ndarray, x: int, y: int, w: int, h: int, strength: int):
    x = max(0, min(cv_img.shape[1], x))
    y = max(0, min(cv_img.shape[0], y))
    w = max(0, min(cv_img.shape[1]-x, w))
    h = max(0, min(cv_img.shape[0]-y, h))
    if w<=0 or h<=0: return
    k = max(3, strength | 1)
    roi = cv_img[y:y+h, x:x+w]
    cv_img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k,k), 0)

def build_masked(img: Image.Image, boxes: List[Dict[str,Any]], strength: int) -> Image.Image:
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    for b in boxes:
        if b.get("hidden", True):
            blur_region(cv_img, int(b["x"]), int(b["y"]), int(b["w"]), int(b["h"]), strength)
            # optional tint
            overlay = cv_img.copy()
            x, y, w, h = int(b["x"]), int(b["y"]), int(b["w"]), int(b["h"])
            cv2.rectangle(overlay, (x,y), (x+w, y+h), (0,0,0), thickness=-1)
            cv_img = cv2.addWeighted(overlay, 0.15, cv_img, 0.85, 0)
    return Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))

def new_item_record(img: Image.Image, fname: str, strength: int) -> Dict[str,Any]:
    item_id = uuid.uuid4().hex[:10]
    ts = datetime.utcnow().isoformat() + "Z"
    base = GALLERY_DIR / item_id
    orig_path = str(base.with_suffix(".orig.jpg"))
    masked_path = str(base.with_suffix(".masked.jpg"))
    # Face detection -> default boxes hidden=True
    faces = detect_faces(img)
    boxes = [{"x":x, "y":y, "w":w, "h":h, "label":"face", "hidden":True} for (x,y,w,h) in faces]
    return {
        "id": item_id,
        "name": fname,
        "title": os.path.splitext(fname)[0],
        "created_at": ts,
        "strength": strength,
        "boxes": boxes,
        "orig_path": orig_path,
        "masked_path": masked_path,
        "public": True,  # gallery shows masked by default
        "content_hash": None
    }

def save_item_files(item: Dict[str,Any], img: Image.Image):
    # Save original JPEG (EXIF stripped due to re-encode)
    Image.fromarray(np.array(img)).save(item["orig_path"], "JPEG", quality=95)
    # Save masked
    masked = build_masked(img, item["boxes"], item["strength"])
    masked.save(item["masked_path"], "JPEG", quality=92)

def load_image_from_path(p: str) -> Image.Image:
    return Image.open(p).convert("RGB")

def delete_item_files(it: Dict[str,Any]):
    for p in [it.get("orig_path"), it.get("masked_path")]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass

def remove_from_index(item_id: str):
    idx = load_index()
    idx["items"] = [x for x in idx.get("items", []) if x.get("id") != item_id]
    save_index(idx)

# ---------------------------- Session State ----------------------------
def init_state():
    if "unlock_hash" not in st.session_state: st.session_state.unlock_hash = None
    if "unlocked" not in st.session_state: st.session_state.unlocked = False
    if "edit_id" not in st.session_state: st.session_state.edit_id = None
    if "view_id" not in st.session_state: st.session_state.view_id = None
    if "permitted" not in st.session_state: st.session_state.permitted = []  # per-photo reveal list
init_state()
ensure_dirs()

# ---------------------------- Sidebar ----------------------------
st.sidebar.title("Controls")

with st.sidebar.expander("Global Unlock (optional)"):
    if not st.session_state.unlocked:
        pw = st.text_input("Enter password to unlock originals", type="password", key="pw_try")
        setpw = st.text_input("Set/Reset password (set once)", type="password", key="pw_set")
        if st.button("Unlock"):
            if st.session_state.unlock_hash and pw and hashlib.sha256(pw.encode()).hexdigest() == st.session_state.unlock_hash:
                st.session_state.unlocked = True
                st.success("Unlocked for this session.")
            else:
                st.error("Incorrect password or none set yet.")
        if st.button("Set/Reset Password"):
            if setpw:
                st.session_state.unlock_hash = hashlib.sha256(setpw.encode()).hexdigest()
                st.success("Password set.")
            else:
                st.warning("Enter a password first.")
    else:
        if st.button("Lock"):
            st.session_state.unlocked = False
            st.info("Locked. Gallery shows masked images again.")

st.sidebar.markdown("---")
st.sidebar.caption("Uploads are stored under ./gallery next to this script.")

# ---------------------------- Upload ----------------------------
st.title(APP_TITLE)


with st.container(border=True):
    st.subheader("Upload")
    # Use a form so uploads only happen when explicitly submitted
    if "uploader_key" not in st.session_state:
        st.session_state.uploader_key = str(uuid.uuid4())
    with st.form(key="upload_form"):
        f = st.file_uploader("Add photos to the gallery", type=["jpg","jpeg","png"], accept_multiple_files=True, key=st.session_state.uploader_key)
        default_strength = st.slider("Default blur strength for new uploads", 7, 49, 21, step=2)
        submitted = st.form_submit_button("Add to gallery")
    if submitted and f:
        idx = load_index()
        # Build a set of existing content hashes to dedupe
        existing_hashes = {it.get("content_hash") for it in idx.get("items", []) if it.get("content_hash")}
        added, skipped = 0, 0
        for file in f:
            img = pil_load_and_normalize(file)
            h = compute_image_hash(img)
            if h in existing_hashes:
                skipped += 1
                continue
            item = new_item_record(img, file.name, default_strength)
            item["content_hash"] = h
            save_item_files(item, img)
            idx["items"].insert(0, item)  # newest first
            existing_hashes.add(h)
            added += 1
        save_index(idx)
        if added:
            st.success(f"Added {added} image(s) to gallery.")
        if skipped:
            st.info(f"Skipped {skipped} duplicate image(s).")
        # Reset uploader so files don't linger and re-submit on rerun
        st.session_state.uploader_key = str(uuid.uuid4())
        st.rerun()
st.markdown("---")

# ---------------------------- Gallery ----------------------------
idx = load_index()
items: List[Dict[str,Any]] = idx.get("items", [])

st.subheader("Gallery")
if not items:
    st.info("No images yet. Upload above to get started.")
else:
    cols = st.columns(4)
    for i, it in enumerate(items):
        with cols[i % 4]:
            try:
                show_original = st.session_state.unlocked or (it["id"] in st.session_state.permitted)
                if show_original:
                    thumb = load_image_from_path(it["orig_path"])
                    cap = f"{it['title']} · original"
                else:
                    thumb = load_image_from_path(it["masked_path"])
                    cap = f"{it['title']} · masked"
                st.image(thumb, caption=cap, use_column_width=True)
            except Exception as e:
                st.error(f"Failed to load image {it['id']}: {e}")
                continue

            st.caption(datetime.fromisoformat(it["created_at"].replace("Z","")).strftime("%Y-%m-%d %H:%M UTC"))
            c1, c2, c3 = st.columns(3)
            with c1:
                if st.button("View", key=f"view_{it['id']}"):
                    st.session_state.view_id = it["id"]
                    st.rerun()
            with c2:
                if st.button("Edit / Blur", key=f"edit_{it['id']}"):
                    st.session_state.edit_id = it["id"]
                    st.rerun()
            with c3:
                if st.button("Delete…", key=f"del_{it['id']}"):
                    st.session_state.view_id = it["id"]  # go to viewer to confirm delete
                    st.rerun()

st.markdown("---")

# Helper to locate item
def get_item_by_id(item_id: str) -> Dict[str,Any]:
    for it in items:
        if it["id"] == item_id:
            return it
    return None

# ---------------------------- Viewer ----------------------------
if st.session_state.view_id:
    it = get_item_by_id(st.session_state.view_id)
    if not it:
        st.warning("Item not found.")
    else:
        st.header(f"View · {it['title']}")
        base_img = load_image_from_path(it["orig_path"])

        allowed = st.session_state.unlocked or (it["id"] in st.session_state.permitted)
        if allowed:
            st.image(base_img, caption="Original (visible in this session)", use_column_width=True)
        else:
            masked = load_image_from_path(it["masked_path"])
            st.image(masked, caption="Masked (locked)", use_column_width=True)

        # Controls
        left, right = st.columns([2,1], gap="large")
        with right:
            if not allowed:
                st.markdown("**Reveal this photo**")
                pw_try = st.text_input("Password", type="password", key=f"reveal_pw_{it['id']}")
                if st.button("Reveal (this photo only)"):
                    if st.session_state.unlock_hash and pw_try and sha256(pw_try) == st.session_state.unlock_hash:
                        st.session_state.permitted.append(it["id"])
                        st.success("This photo is revealed for this session.")
                        st.rerun()
                    else:
                        st.error("Incorrect password.")
            else:
                st.success("This photo is revealed.")

            st.markdown("---")
            st.markdown("**Download**")
            if allowed:
                # original
                img_bytes = io.BytesIO()
                base_img.save(img_bytes, format="JPEG", quality=95)
                st.download_button("Download original JPEG", img_bytes.getvalue(), file_name=f"{it['title']}-original.jpg", mime="image/jpeg")
            # masked
            masked_img = load_image_from_path(it["masked_path"])
            masked_bytes = io.BytesIO()
            masked_img.save(masked_bytes, format="JPEG", quality=92)
            st.download_button("Download masked JPEG", masked_bytes.getvalue(), file_name=f"{it['title']}-masked.jpg", mime="image/jpeg")

            st.markdown("---")
            st.markdown("**Delete photo**")
            confirm = st.text_input("Type DELETE to confirm", key=f"confirm_del_{it['id']}")
            if st.button("Delete permanently"):
                if confirm.strip().upper() == "DELETE":
                    delete_item_files(it)
                    remove_from_index(it["id"])
                    st.success("Photo deleted.")
                    st.session_state.view_id = None
                    st.rerun()
                else:
                    st.warning("Please type DELETE to confirm.")

        if st.button("Back to gallery"):
            st.session_state.view_id = None
            st.rerun()

# ---------------------------- Editor ----------------------------
if st.session_state.edit_id:
    it = get_item_by_id(st.session_state.edit_id)
    if not it:
        st.warning("Item not found.")
    else:
        st.header(f"Edit · {it['title']}")

        base_img = load_image_from_path(it["orig_path"])

        left, right = st.columns([2,1], gap="large")
        with left:
            preview = build_masked(base_img, it["boxes"], it["strength"])
            st.image(preview, caption="Masked preview", use_column_width=True)

        with right:
            it["title"] = st.text_input("Title", value=it["title"])
            it["strength"] = st.slider("Blur strength", 5, 49, int(it["strength"]), step=2)

            st.markdown("**Regions** (check = hide/blur)")
            if not it["boxes"]:
                st.caption("No regions detected. Use 'Detect faces' or add manual box.")
            else:
                for idx_i, b in enumerate(it["boxes"]):
                    c1, c2, c3 = st.columns([1.6, 1, 1])
                    with c1:
                        st.checkbox(f"#{idx_i+1} {b.get('label','box')}", value=bool(b.get('hidden', True)), key=f'boxhide_{it["id"]}_{idx_i}')
                        it["boxes"][idx_i]["hidden"] = st.session_state.get(f'boxhide_{it["id"]}_{idx_i}', True)
                    with c2:
                        it["boxes"][idx_i]["x"] = int(st.number_input("x", value=int(b["x"]), step=1, key=f'x_{it["id"]}_{idx_i}'))
                        it["boxes"][idx_i]["y"] = int(st.number_input("y", value=int(b["y"]), step=1, key=f'y_{it["id"]}_{idx_i}'))
                    with c3:
                        it["boxes"][idx_i]["w"] = int(st.number_input("w", value=int(b["w"]), step=1, key=f'w_{it["id"]}_{idx_i}'))
                        it["boxes"][idx_i]["h"] = int(st.number_input("h", value=int(b["h"]), step=1, key=f'h_{it["id"]}_{idx_i}'))

            st.markdown("---")
            if st.button("Detect faces (auto-add)"):
                faces = detect_faces(base_img)
                added = 0
                for (x,y,w,h) in faces:
                    duplicate = False
                    for b in it["boxes"]:
                        if abs(b["x"]-x)<10 and abs(b["y"]-y)<10 and abs(b["w"]-w)<10 and abs(b["h"]-h)<10:
                            duplicate = True
                            break
                    if not duplicate:
                        it["boxes"].append({"x":int(x),"y":int(y),"w":int(w),"h":int(h),"label":"face","hidden":True})
                        added += 1
                st.success(f"Auto-detected faces added: {added}")

            with st.expander("Add manual box"):
                c1, c2, c3, c4 = st.columns(4)
                X1 = c1.number_input("x", min_value=0, value=0, step=1, key="man_x")
                Y1 = c2.number_input("y", min_value=0, value=0, step=1, key="man_y")
                W1 = c3.number_input("w", min_value=1, value=100, step=1, key="man_w")
                H1 = c4.number_input("h", min_value=1, value=100, step=1, key="man_h")
                if st.button("Add box"):
                    it["boxes"].append({"x":int(X1),"y":int(Y1),"w":int(W1),"h":int(H1),"label":"manual","hidden":True})
                    st.success("Box added.")

            st.markdown("---")
            if st.button("Save masked image"):
                masked = build_masked(base_img, it["boxes"], it["strength"])
                masked.save(it["masked_path"], "JPEG", quality=92)
                idx = load_index()
                for j, jitem in enumerate(idx["items"]):
                    if jitem["id"] == it["id"]:
                        idx["items"][j] = it
                        break
                save_index(idx)
                st.success("Saved masked image and metadata.")

            # Quick delete from editor
            with st.expander("Delete this photo"):
                confirm2 = st.text_input("Type DELETE to confirm", key=f"confirm_del_editor_{it['id']}")
                if st.button("Delete permanently", key=f"delete_editor_{it['id']}"):
                    if confirm2.strip().upper() == "DELETE":
                        delete_item_files(it)
                        remove_from_index(it["id"])
                        st.success("Photo deleted.")
                        st.session_state.edit_id = None
                        st.rerun()
                    else:
                        st.warning("Please type DELETE to confirm.")

            if st.button("Back to gallery"):
                st.session_state.edit_id = None
                st.rerun()

st.caption("Gallery shows masked images by default. Use global unlock or per-photo reveal to view originals. Delete permanently removes files and metadata. EXIF/GPS is stripped on save.")
