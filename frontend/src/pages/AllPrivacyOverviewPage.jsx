import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrafts } from '../contexts/DraftsContext';

const BACKEND = "http://localhost:8000"; // change if needed

export default function AllImagesOverviewPage() {
  const [showModal, setShowModal] = useState(false);
  const { drafts, clearDrafts } = useDrafts();
  const navigate = useNavigate();

  if (!drafts || drafts.length === 0) {
    return (
      <div className="w-full max-w-[390px] mx-auto min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
        <p>No drafts available.</p>
        <button
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold"
          onClick={() => {
            clearDrafts();
            navigate("/upload");
          }} // go back to previous page
        >
          Back
        </button>
      </div>
    );
  }

  const handleSelectDraft = (draft) => {
    // navigate to Privacy Overview page for the selected draft
    navigate("/privacy-overview", { state: { draftId: draft.draftId } });
  };

  const handleConfirmClick = () => {
    setShowModal(true);
  };

  const handleYes = async () => {
    setShowModal(false);
    // TODO: handle backend logic
    try {
      // map drafts to the ImageModel expected by the backend
      const imagesPayload = drafts.map(draft => ({
        type: draft.type,
        url: draft.url,
        originalUrl: draft.fileObj ? URL.createObjectURL(draft.fileObj) : null, // optional original URL
      }));
  
      const response = await fetch(`${BACKEND}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1,
          caption: "",
          images: imagesPayload,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to post drafts");
      }
  
      const data = await response.json();
      console.log("Posted successfully:", data);
  
      // clear drafts and navigate home
      clearDrafts();
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error posting drafts. Please try again.");
    }
  };

  const handleNo = () => {
    setShowModal(false);
  }

  return (
    <div className="flex justify-center bg-black min-h-screen py-8">
      <div className="w-[390px]">
        
        {/* Back button */}
        <button
            className="mb-4 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold w-fit text-white"
            onClick={() => {
                clearDrafts();
                navigate("/upload");
            }}
        >
            Back
        </button>

        <h2 className="text-xl font-bold mb-4 text-white">Drafts Overview</h2>

        {/* Carousel of drafts */}
        <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-2">
          {drafts.map((draft) => (
            <div
              key={draft.draftId}
              className="flex-shrink-0 w-full max-w-[390px] bg-gray-800 rounded-lg relative cursor-pointer snap-center"
              onClick={() => handleSelectDraft(draft)}
            >
              {draft.type === "image" ? (
                <div className="flex flex-col items-center">
                  <img
                      src={draft.url}
                      alt="draft"
                      className="w-full h-auto object-contain rounded-lg"
                  />
                  <p className="mt-2 text-sm text-yellow-400 text-center">
                      Warning: this image might expose private details like location. 
                      A safety mask has been applied for your protection. Click the image if you wish to modify it.
                  </p>
                </div>
              ) : (
                <video
                  src={draft.url}
                  className="w-full h-full object-cover rounded-lg"
                  loop
                  muted
                  autoPlay
                />
              )}
            </div>
          ))}
        </div>

        {/* Confirm button */}
        <button
        onClick={handleConfirmClick}
        className="fixed bottom-6 right-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-lg"
        >
            Confirm
        </button>

        {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to post?
            </h2>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleNo}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                No
              </button>
              <button
                onClick={handleYes}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
