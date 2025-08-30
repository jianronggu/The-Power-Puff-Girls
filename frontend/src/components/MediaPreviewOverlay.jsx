import { useEffect, useRef } from "react";
import blurMask from '../assets/Blur Mask.jpg';

function MediaPreviewOverlay({ file, maskName }) {
    const containerRef = useRef(null);
    // TODO: update with the bottom comment
    const overlayMaskUrl = blurMask;
    // const overlayMaskUrl = file.mask[maskName][0].url; 
    
    useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
    }, [file]);

    if (!file) {
        return (
          <div className="w-full h-[300px] bg-gray-800 mb-4 flex items-center justify-center">
            <p className="text-gray-400">No media selected</p>
          </div>
        );
      }

    return (
        <div 
            ref={containerRef}
            className="w-full h-[300px] mb-4 relative flex items-center justify-center bg-gray-800 rounded overflow-hidden"
        >
            {file.type === "video" ? (
                <video
                    src={file.url}
                    className="w-full h-full object-cover"
                    controls
                />
            ) : (
                <img
                    src={file.url}
                    alt="preview"
                    className="w-full h-full object-cover"
                />
            )}

            {overlayMaskUrl && (
                <img
                src={overlayMaskUrl}
                alt="mask overlay"
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 pointer-events-none"
                />
            )}
        </div>
    )
}

export default MediaPreviewOverlay