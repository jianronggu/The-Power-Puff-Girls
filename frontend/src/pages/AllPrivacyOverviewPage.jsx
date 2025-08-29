import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrafts } from '../contexts/DraftsContext';

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

  // Mock drafts: array of objects { id, type, src }
//   const [drafts] = useState([
//     { id: 1, type: "image", src: "https://picsum.photos/400/600?random=1" },
//     { id: 2, type: "image", src: "https://picsum.photos/400/600?random=2" },
//     { id: 3, type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
//     { id: 4, type: "image", src: "https://picsum.photos/400/600?random=3" },
//   ]);

  const handleSelectDraft = (draft) => {
    // navigate to Privacy Overview page for the selected draft
    navigate("/privacy-overview", { state: { draftId: draft.draftId } });
  };

  const handleConfirmClick = () => {
    setShowModal(true);
  };

  const handleYes = () => {
    setShowModal(false);
    // TODO: backend posting logic
    clearDrafts();
    navigate("/");
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
              className="flex-shrink-0 w-[360px] h-[640px] bg-gray-800 rounded-lg relative cursor-pointer snap-center"
              onClick={() => handleSelectDraft(draft)}
            >
              {draft.type === "image" ? (
                <img
                  src={draft.url}
                  alt="draft"
                  className="w-full h-full object-cover rounded-lg"
                />
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
