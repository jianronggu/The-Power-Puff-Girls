import { useState, useEffect } from "react";
import MediaPreview from "../components/MediaPreview";
import LoaderPage from "./LoaderPage";
import AllImagesOverviewPage from "./AllPrivacyOverviewPage";
import { useDrafts } from "../contexts/DraftsContext";
import { useNavigate } from 'react-router-dom';

function UploadPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [stage, setStage] = useState("upload"); // "upload" | "loading" | "privacy"
  const { addDrafts } = useDrafts();

  useEffect(() => {
    if (stage === "privacy") {
      navigate("/all-drafts"); // or whatever route your AllImagesOverviewPage is on
    }
  }, [stage, navigate]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const isVideo = files.every(file => file.type.startsWith("video/"));
    const isImage = files.every(file => file.type.startsWith("image/"));

    if (files.length === 0) return; // exit if user cancels

    if (isVideo) {
        if (files.length > 1) {
          alert("You can only upload one video at a time.");
          return;
        }
        setSelectedFiles(
          files.map(file => ({
            draftId: Date.now(),
            url: URL.createObjectURL(file),
            type: "video",
            mask: {face: {}, doc: {}, location: {}, plate: {}}
          }))
        );
    } else if (isImage) {
        const remainingSlots = 5 - selectedFiles.length;
      if (files.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more image(s).`);
        return;
      }
      setSelectedFiles(prev => [
        ...prev,
        ...files.map(file => ({ 
            draftId: Date.now(),
            url: URL.createObjectURL(file), 
            type: "image" ,
            mask: {face: {}, doc: {}, location: {}, plate: {}}
        }))
      ]);
      } else {
        alert("Please select either images or a single video.");
        return;
      }

      e.target.value = "";
    // setSelectedFile(URL.createObjectURL(e.target.files[0]));
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isVideoSelected = selectedFiles.length === 1 && selectedFiles[0].type === "video";
  const canAddMoreImages = selectedFiles.filter(f => f.type === "image").length < 5 && !isVideoSelected;

  const handlePublish = () => {
    alert(`Published ${selectedFiles.length} file(s)!\nCaption: ${caption}`);
    // TODO: integrate your backend upload logic (MOCK FOR NOW)
    
    addDrafts(selectedFiles); 
    // TODO: add logic to link to the AI processor, which will update the drafts with the respective masks and add a status called "ai-suggested"

    setStage("loading");

    setTimeout(() => {
        setStage("privacy");
    }, 3000);
  };

  if (stage === "loading") return <LoaderPage />;

//   if (stage === "privacy") return <AllImagesOverviewPage />;
    // return (
    //   <PrivacyOverviewPage
    //     detectedElements={mockDetected}
    //     onConfirm={() => setStage("upload")} // or redirect to home/confirmation
    //   />
    // );

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

      <button
        className="hover:bg-red-600 py-2 rounded font-bold"
        style={{ backgroundColor: "#EE1D52" }}
        onClick={handlePublish}
        disabled={selectedFiles.length === 0}
      >
        Publish
      </button>
    </div>
  );
}

export default UploadPage;