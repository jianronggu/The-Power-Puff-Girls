import { useEffect, useRef } from "react";
import { X } from "lucide-react";

function MediaPreview({ selectedFiles, removeFile }) {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
      }, [selectedFiles]);

    return (
        <div 
            ref={containerRef}
            className="w-full h-[300px] bg-gray-800 mb-4 overflow-x-scroll snap-x snap-mandatory flex"
        >
            {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                    <div
                        key={idx}
                        className="snap-center w-full h-[300px] relative flex-shrink-0"
                    >
                        {file.type === "video" ? (
                            <video
                                src={file.url}
                                className="w-full h-full object-cover rounded"
                                controls
                            />
                        ) : (
                            <img
                                src={file.url}
                                alt={`preview-${idx}`}
                                className="w-full h-full object-cover rounded"
                            />
                        )}
                        {/* Remove button */}
                        <button
                            onClick={() => removeFile(idx)}
                            className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-red-500"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 flex items-center justify-center w-full">No media selected</p>
            )}
        </div>
    )
}

export default MediaPreview