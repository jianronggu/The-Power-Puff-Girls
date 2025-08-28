import { useNavigate } from "react-router-dom";
import { useDrafts } from '../contexts/DraftsContext';

export default function AllImagesOverviewPage() {
  const { drafts } = useDrafts();
  const navigate = useNavigate();

  if (!drafts || drafts.length === 0) {
    return (
      <div className="w-full max-w-[390px] mx-auto min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
        <p>No drafts available.</p>
        <button
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold"
          onClick={() => navigate("/upload")} // go back to previous page
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

  return (
    <div className="flex justify-center bg-black min-h-screen text-white py-8">
      <div className="w-[390px]">
        
        {/* Back button */}
        <button
            className="mb-4 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold w-fit"
            onClick={() => navigate("/upload")}
        >
            Back
        </button>

        <h2 className="text-xl font-bold mb-4">Drafts Overview</h2>

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
      </div>
    </div>
  );
}
