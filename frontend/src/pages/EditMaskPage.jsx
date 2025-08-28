import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDrafts } from "../contexts/DraftsContext";
import blurMask from '../assets/Blur Mask.jpg';

export default function EditMaskPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { drafts, updateDraft } = useDrafts();
//   const [maskHistory, setMaskHistory] = useState([]);
  const { draftId, category } = location.state || {};
  const draft = drafts.find((d) => d.draftId === draftId);

  if (!draft) {
    return (
        <div className="w-full max-w-[390px] mx-auto min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
            <p>Draft not found.</p>
            <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold"
                onClick={() => navigate("/all-drafts")}
            >
                Back
            </button>
        </div>
    );
  }

  const imageUrl = draft.url;
//   const maskDataUrl = blurMask;

  const imgRef = useRef(null);
  const maskCanvasRef = useRef(null);
//   const previewCanvasRef = useRef(null);
  const originalMaskRef = useRef(null);
  const maskCtxRef = useRef(null);
  const maskHistoryRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("erase"); // "erase" or "restore"
  const [brush, setBrush] = useState(32);

  // load base image and mask
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;

      const maskCanvas = maskCanvasRef.current;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      maskCanvas.width = w;
      maskCanvas.height = h;

      const maskCtx = maskCanvas.getContext("2d");
      maskCtxRef.current = maskCtx;

      // Load existing mask or placeholder
      const maskDataUrl = draft.mask?.[category]?.url || blurMask;
      const maskImg = new Image();
      maskImg.crossOrigin = "anonymous";
      maskImg.src = maskDataUrl;
      maskImg.onload = () => {
        // Crop or scale mask to image dimensions
        maskCtx.clearRect(0, 0, w, h);
        maskCtx.globalAlpha = 0.6;
        maskCtx.drawImage(maskImg, 0, 0, maskImg.naturalWidth, maskImg.naturalHeight, 0, 0, w, h);
        maskCtx.globalAlpha = 1;

        // Save original mask
        const originalCanvas = document.createElement("canvas");
        originalCanvas.width = w;
        originalCanvas.height = h;
        originalCanvas.getContext("2d").drawImage(maskCanvas, 0, 0);
        originalMaskRef.current = originalCanvas;

        // Initialize history with original
        const historyCanvas = document.createElement("canvas");
        historyCanvas.width = w;
        historyCanvas.height = h;
        historyCanvas.getContext("2d").drawImage(maskCanvas, 0, 0);
        maskHistoryRef.current = [historyCanvas];
      };
    };
  }, [draft, category]);

  const getCanvasPos = (e) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  let lastX = null;
  let lastY = null;

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasPos(e);
    const ctx = maskCtxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastX = x;
    lastY = y;
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = maskCtxRef.current;
    const { x, y } = getCanvasPos(e);

    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else if (mode === "restore") {
      const originalCanvas = originalMaskRef.current;
      if (!originalCanvas) return;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(originalCanvas, 0, 0);
      setMode("erase"); // back to erase
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    lastX = x;
    lastY = y;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastX = null;
    lastY = null;
    maskCtxRef.current.beginPath();

    // Save current mask state to history
    const maskCanvas = maskCanvasRef.current;
    const snapshot = document.createElement("canvas");
    snapshot.width = maskCanvas.width;
    snapshot.height = maskCanvas.height;
    snapshot.getContext("2d").drawImage(maskCanvas, 0, 0);
    maskHistoryRef.current.push(snapshot);
  };

  const handleUndo = () => {
    const history = maskHistoryRef.current;
    if (history.length <= 1) return; // keep at least original
    history.pop();
    const last = history[history.length - 1];
    const ctx = maskCtxRef.current;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(last, 0, 0);
  };

  const handleSave = () => {
    const maskCanvas = maskCanvasRef.current;
    const maskDataUrl = maskCanvas.toDataURL("image/png");

    updateDraft(draftId, {
      ...draft,
      mask: {
        ...draft.mask,
        [category]: { url: maskDataUrl },
      },
    });

    navigate(-1);
  };

  const handleCancel = () => navigate(-1);

  return (
    <div className="flex flex-col items-center gap-4 p-4 text-white">
      <div className="w-full max-w-[390px]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded font-bold"
          >
            Back
          </button>
          <h2 className="text-lg font-semibold">Edit Mask ({category})</h2>
          <div className="w-16" />
        </div>

        {/* Stack: image + mask canvas */}
        <div className="relative w-full rounded overflow-hidden bg-black">
          <img
            src={imageUrl}
            alt="to-edit"
            className="w-full block select-none pointer-events-none"
            draggable={false}
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ touchAction: "none" }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setMode("erase")}
            className={`px-3 py-2 rounded ${mode === "erase" ? "bg-red-600" : "bg-gray-700"}`}
          >
            Erase
          </button>
          <button
            onClick={() => setMode("restore")}
            className={`px-3 py-2 rounded ${mode === "restore" ? "bg-blue-600" : "bg-gray-700"}`}
          >
            Restore
          </button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-300">Brush</label>
            <input
              type="range"
              min="8"
              max="72"
              value={brush}
              onChange={(e) => setBrush(Number(e.target.value))}
            />
            <span className="text-sm w-8 text-right">{brush}</span>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-2 bg-yellow-600 rounded text-black font-bold"
          >
            Undo
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}