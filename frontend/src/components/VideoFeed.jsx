import { useState } from 'react'
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react"

function VideoFeed() {
    const [videos] = useState([
        { id: 1, src: "https://www.w3schools.com/html/mov_bbb.mp4", user: "@user1", caption: "Check out this cool video!" },
        { id: 2, src: "https://www.w3schools.com/html/movie.mp4", user: "@user2", caption: "Another fun video!" },
    ]);

    return (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory">
            {videos.map((video) => (
                <div key={video.id} className="snap-start h-screen flex flex-col justify-center items-center relative">

                    <video src={video.src} className="w-full h-full object-cover" autoPlay loop muted />

                    <div className="absolute bottom-24 left-4 text-white">
                        <p className="font-bold">{video.user}</p>
                        <p>{video.caption}</p>
                    </div>

                    <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6 text-white">
                        
                        <div className="w-12 h-12 rounded-full bg-gray-400 border-2 border-white" />

                        <button className="flex flex-col items-center space-y-1">
                            <Heart fill="white" className="w-6 h-6" />
                            <span className="text-xs">123K</span>
                        </button>

                        <button className="flex flex-col items-center space-y-1">
                            <MessageCircle fill="white" className="w-6 h-6" />
                            <span className="text-xs">456</span>
                        </button>

                        <button className="flex flex-col items-center space-y-1">
                            <Bookmark fill="white" className="w-6 h-6" />
                            <span className="text-xs">13K</span>
                        </button>

                        <button className="flex flex-col items-center space-y-1">
                            <Share2 fill="white" className="w-6 h-6" />
                            <span className="text-xs">4,574</span>
                        </button>
                    </div>

                </div>
            ))}
        </div>
    )
}

export default VideoFeed