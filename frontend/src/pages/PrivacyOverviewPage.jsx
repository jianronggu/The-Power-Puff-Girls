import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDrafts } from "../contexts/DraftsContext";
import MediaPreviewOverlay from "../components/MediaPreviewOverlay";

export default function PrivacyOverviewPage() {
  const { drafts } = useDrafts();
  const location = useLocation();
  const navigate = useNavigate();
  const { draftId } = location.state || {};
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

  const categories = Object.keys(draft.mask); // e.g. faces, docs, license plates, location
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const handleEditMask = () => {
    // navigate("/edit-mask", { state: { draftId, category: activeCategory } });
    navigate("/edit-mask-lama", { state: { draftId, category: activeCategory } });
  }

  const onConfirm = () => {
    // TODO: some backend logic
    navigate("/all-drafts");
  }; 

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-black text-white p-4 flex flex-col">

      {/* Tabs */}
      <div className="flex justify-around mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded ${
              activeCategory === cat ? "bg-white text-black" : "bg-gray-700 text-gray-300"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto">
        <MediaPreviewOverlay file={draft} maskName={activeCategory} />
      </div>

      {/* Unified Action Bar */}
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
          onClick={() => navigate("/all-drafts")}
        >
          Cancel
        </button>
        <button
          className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded font-bold"
          onClick={handleEditMask}
        >
          Edit Mask
        </button>
        <button
          className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold"
          onClick={onConfirm}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}