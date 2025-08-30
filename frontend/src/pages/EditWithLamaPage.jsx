import InpaintEditor from "../components/InpaintEditor";
import { useDrafts } from "../contexts/DraftsContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function EditWithLamaPage() {
  // This could come from your Drafts context
//   const imageUrl = "/sample.jpg"; // or a blob/objectURL from user upload
  const location = useLocation();
  const navigate = useNavigate();
  const { drafts, updateDraft } = useDrafts();
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

  return (
    <div className="min-h-screen bg-black text-white flex justify-center py-6">
      <InpaintEditor
        imageUrl={imageUrl}
        apiUrl="http://localhost:8080/inpaint"
        onResult={(url) => {
          // e.g. update your draft preview
          console.log("Inpainted result:", url);
        }}
      />
    </div>
  );
}