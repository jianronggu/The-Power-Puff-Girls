import { useState, useEffect } from "react";
import MediaPreview from "../components/MediaPreview";
import LoaderPage from "./LoaderPage";
import { useDrafts } from "../contexts/DraftsContext";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:8000"; // change if needed
const MAX_IMAGES = 5;

function UploadPage() {
  const navigate = useNavigate();
  const { addDrafts } = useDrafts();

  const [selectedFiles, setSelectedFiles] = useState([]); // [{ draftId, fileObj, url, type, mask }]
  const [caption, setCaption] = useState("");
  const [stage, setStage] = useState("upload"); // "upload" | "loading" | "privacy"
  const [processingMode, setProcessingMode] = useState("blur"); // "blur" | "clean"
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (stage === "privacy") navigate("/all-drafts");
  }, [stage, navigate]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const isVideo = files.every((f) => f.type.startsWith("video/"));
    const isImage = files.every((f) => f.type.startsWith("image/"));

    if (!isVideo && !isImage) {
      alert("Please select either images or a single video.");
      return;
    }

    if (isVideo) {
      if (files.length > 1) {
        alert("You can only upload one video at a time.");
        return;
      }
      const file = files[0];
      setSelectedFiles([
        {
          draftId: Date.now(),
          fileObj: file,
          url: URL.createObjectURL(file),
          type: "video",
          mask: { face: {}, doc: {}, location: {}, plate: {} },
        },
      ]);
      return;
    }

    // images
    const currentImages = selectedFiles.filter((f) => f.type === "image").length;
    const remaining = MAX_IMAGES - currentImages;
    if (files.length > remaining) {
      alert(`You can only upload ${remaining} more image(s).`);
      return;
    }

    const toAdd = files.map((file, i) => ({
      draftId: Date.now() + i,
      fileObj: file,
      url: URL.createObjectURL(file),
      type: "image",
      mask: { face: {}, doc: {}, location: {}, plate: {} },
    }));

    setSelectedFiles((prev) => [...prev, ...toAdd]);

    // optional: clear input so selecting the same file again fires onChange
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isVideoSelected =
    selectedFiles.length === 1 && selectedFiles[0].type === "video";

  const handlePublish = async () => {
    if (selectedFiles.length === 0 || isPublishing) return;

    setIsPublishing(true);
    try {
      const processedDrafts = await Promise.all(
        selectedFiles.map(async (file) => {
          // videos: just store as-is for now
          if (file.type === "video") return file;

          const formData = new FormData();
          formData.append("file", file.fileObj);

          const endpoint =
            processingMode === "blur"
              ? `${BACKEND}/blur-faces/`
              : `${BACKEND}/clean-image/`;

          try {
            const res = await fetch(endpoint, { method: "POST", body: formData });
            if (!res.ok) {
              console.error(
                "Backend error:",
                res.status,
                await res.text().catch(() => "")
              );
              return file; // keep original if processing fails
            }
            const blob = await res.blob();
            const resultUrl = URL.createObjectURL(blob);

            return {
              ...file,
              url: resultUrl, // preview processed image
              processed: true,
              mask: {
                ...(processingMode === "blur" ? { face: { url: resultUrl } } : {}),
                ...(processingMode === "clean" ? { doc: { url: resultUrl } } : {}),
                location: {},
                plate: {},
              },
            };
          } catch (err) {
            console.error("Request failed:", err);
            return file; // keep original
          }
        })
      );

      // You can include caption here if your context supports it
      addDrafts(processedDrafts);
      setStage("loading");
      setTimeout(() => setStage("privacy"), 1200);
    } catch (err) {
      console.error("Error in handlePublish:", err);
      alert("Something went wrong while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (stage === "loading") return <LoaderPage />;

  return (
    <div className="flex flex-col justify-center h-screen bg-black text-white p-4">
      {/* Back button */}
      <button
        className="mb-4 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold w-fit"
        onClick={() => navigate("/")}
      >
        Back
      </button>

      <h2 className="text-xl font-bold mb-4">Upload Media</h2>

      <MediaPreview selectedFiles={selectedFiles} removeFile={removeFile} />

      <label className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-2 rounded mb-4 text-center font-bold">
        {isVideoSelected ? "Replace Video" : "Select Media"}
        <input
          type="file"
          accept="video/*,image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      <textarea
        className="w-full p-2 rounded bg-gray-900 text-white mb-4"
        placeholder="Add a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <label className="text-sm text-gray-300 mb-1 block">
        Choose Privacy Action:
      </label>
      <select
        className="w-full p-2 rounded bg-gray-900 text-white mb-4"
        value={processingMode}
        onChange={(e) => setProcessingMode(e.target.value)}
      >
        <option value="blur">🤖 Blur Faces</option>
        <option value="clean">🧽 Remove Text/Logos</option>
      </select>

      <button
        className="hover:bg-red-600 py-2 rounded font-bold disabled:opacity-50"
        style={{ backgroundColor: "#EE1D52" }}
        onClick={handlePublish}
        disabled={selectedFiles.length === 0 || isPublishing}
      >
        {isPublishing ? "Processing..." : "Publish"}
      </button>
    </div>
  );
}

export default UploadPage;
