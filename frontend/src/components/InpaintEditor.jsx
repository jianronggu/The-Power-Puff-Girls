import React, { useEffect, useRef, useState } from "react";

/**
 * InpaintEditor
 * Props:
 *  - imageUrl (string): the image to edit
 *  - apiUrl (string): Lama Cleaner endpoint (e.g. "http://localhost:5000/inpaint")
 *  - onResult? (fn): called with the resulting objectURL after successful inpaint
 */
export default function InpaintEditor({
  imageUrl,
  apiUrl = "http://localhost:8080/inpaint",
  onResult,
}) {
  const baseCanvasRef = useRef(null); // original image, not interactive
  const maskCanvasRef = useRef(null); // paint mask (white = remove)
  const containerRef = useRef(null);  // for responsive sizing, pointer mapping

  const imgRef = useRef(null);        // HTMLImageElement
  const maskCtxRef = useRef(null);
  const [isPainting, setIsPainting] = useState(false);
  const [mode, setMode] = useState("paint"); // "paint" or "erase"
  const [brush, setBrush] = useState(28);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  // simple undo stack for the mask (stores ImageData)
  const undoStackRef = useRef([]);

  // load image and size canvases to the image’s natural size
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;

      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // size canvases to image pixels
      const base = baseCanvasRef.current;
      const mask = maskCanvasRef.current;

      base.width = w;
      base.height = h;
      mask.width = w;
      mask.height = h;

      // draw base image once
      const bctx = base.getContext("2d");
      bctx.clearRect(0, 0, w, h);
      bctx.drawImage(img, 0, 0, w, h);

      // prepare mask context
      const mctx = mask.getContext("2d");
      mctx.clearRect(0, 0, w, h);
      mctx.globalCompositeOperation = "source-over";
      mctx.lineCap = "round";
      mctx.lineJoin = "round";
      mctx.strokeStyle = "#ffffff"; // white means "inpaint this region"
      mctx.lineWidth = brush;
      maskCtxRef.current = mctx;

      // reset UI state
      undoStackRef.current = [];
      setResultUrl(null);
    };

    img.onerror = () => {
      console.error("Failed to load image:", imageUrl);
    };
  }, [imageUrl]);

  // keep brush size synced with context
  useEffect(() => {
    const ctx = maskCtxRef.current;
    if (ctx) ctx.lineWidth = brush;
  }, [brush]);

//   const toBase64 = (file) =>
//     new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file); // automatically includes "data:image/png;base64,"
//       reader.onload = () => resolve(reader.result);
//       reader.onerror = (error) => reject(error);
//     });

  const toBase64FromCanvas = (canvas, quality=0.9) =>
    new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Failed to get blob from canvas");
            const reader = new FileReader();
            reader.readAsDataURL(blob); // converts blob to "data:image/jpeg;base64,..."
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
          },
          "image/jpeg", // use JPEG to reduce size
          quality // compression quality 0-1
        );
    });

  // map pointer to mask canvas coords (handles CSS scaling)
  const getPos = (e) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      e.clientX ??
      (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY =
      e.clientY ??
      (e.touches && e.touches[0] && e.touches[0].clientY);

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const pushUndo = () => {
    const ctx = maskCtxRef.current;
    if (!ctx) return;
    try {
      const snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      undoStackRef.current.push(snapshot);
      // limit stack size
      if (undoStackRef.current.length > 30) {
        undoStackRef.current.shift();
      }
    } catch {
      // some browsers can throw if canvas is tainted
    }
  };

  const undo = () => {
    const ctx = maskCtxRef.current;
    if (!ctx || undoStackRef.current.length === 0) return;
    const last = undoStackRef.current.pop();
    ctx.putImageData(last, 0, 0);
  };

  const clearMask = () => {
    const ctx = maskCtxRef.current;
    if (!ctx) return;
    pushUndo();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // painting
  const handlePointerDown = (e) => {
    e.preventDefault();
    const ctx = maskCtxRef.current;
    if (!ctx) return;

    pushUndo(); // save state before this stroke

    setIsPainting(true);
    const { x, y } = getPos(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e) => {
    if (!isPainting) return;
    e.preventDefault();
    const ctx = maskCtxRef.current;
    if (!ctx) return;

    const { x, y } = getPos(e);

    // paint = white, erase = clear mask (destination-out)
    if (mode === "paint") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255,255,255,1)";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerUp = () => {
    setIsPainting(false);
    const ctx = maskCtxRef.current;
    if (ctx) ctx.beginPath();
  };

  // send to Lama Cleaner
  const handleReplace = async () => {
    if (!apiUrl) return;
    setLoading(true);
    setResultUrl(null);
    try {
        const [imageB64, maskB64] = await Promise.all([
          toBase64FromCanvas(baseCanvasRef.current), // returns data:image/png;base64
          toBase64FromCanvas(maskCanvasRef.current),
        ]);

        // perform size comparison check
        const img = new Image();
        img.src = imageB64; 
        img.onload = () => {
          console.log("Base64 image size:", img.width, img.height);
        };

        const maskImg = new Image();
        maskImg.src = maskB64; 
        maskImg.onload = () => {
          console.log("Base64 mask image size:", maskImg.width, maskImg.height);
        };
    
        // const body = {
        //   image: imageB64,
        //   mask: maskB64
        // };
        const body = {
            image: "hello",
            mask: "world"
        };
        if (prompt.trim()) body.prompt = prompt.trim();
        console.log("Payload:", JSON.stringify(body));
    
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body),
        });
    
        if (!res.ok) {
          throw new Error(`Server responded ${res.status}: ${await res.text()}`);
        }
    
        const resultBlob = await res.blob();
        const url = URL.createObjectURL(resultBlob);
        setResultUrl(url);
        onResult?.(url);
    } catch (err) {
        console.error(err);
        alert("Inpaint failed. Check your Lama Cleaner server & CORS.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[390px] mx-auto text-white">
      {/* Canvas stack */}
      <div
        ref={containerRef}
        className="relative w-full rounded overflow-hidden bg-black"
        style={{ aspectRatio: "3 / 4" }} // keeps a tall phone-ish frame
      >
        {/* base image canvas */}
        <canvas
          ref={baseCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* mask canvas (interactive) */}
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setMode("paint")}
          className={`px-3 py-2 rounded ${mode === "paint" ? "bg-pink-600" : "bg-gray-700"}`}
        >
          Paint
        </button>
        <button
          onClick={() => setMode("erase")}
          className={`px-3 py-2 rounded ${mode === "erase" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Erase
        </button>

        <button onClick={undo} className="px-3 py-2 rounded bg-gray-700">
          Undo
        </button>
        <button onClick={clearMask} className="px-3 py-2 rounded bg-gray-700">
          Clear
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-300">Brush</label>
          <input
            type="range"
            min="6"
            max="72"
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
          <span className="text-sm w-8 text-right">{brush}</span>
        </div>
      </div>

      {/* Prompt + Action */}
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 bg-gray-900 rounded px-3 py-2"
          placeholder="Prompt (optional) e.g. 'replace with wall'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleReplace}
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Replacing..." : "Replace"}
        </button>
      </div>

      {/* Result preview */}
      {resultUrl && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-300">Result:</p>
          <img
            src={resultUrl}
            alt="result"
            className="w-full rounded shadow"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}