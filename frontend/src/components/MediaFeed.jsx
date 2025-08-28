import { useState } from 'react'
import { Heart, MessageCircle, Bookmark, Share2, Lock } from "lucide-react"

function MediaFeed() {
    // TODO: update the posts state and structure (media should follow draft format)
    const [posts] = useState([
        { id: 1, type: "video", media: ["https://www.w3schools.com/html/mov_bbb.mp4"], user: "@user1", caption: "Check out this cool video!", mask: false },
        { id: 2, type: "video", media: ["https://www.w3schools.com/html/movie.mp4"], user: "@user2", caption: "Another fun video!", mask: false },
        {
            id: 3,
            type: "images",
            media: [
              "https://picsum.photos/id/1015/800/1200",
              "https://picsum.photos/id/1014/800/1200",
              "https://picsum.photos/id/1013/800/1200",
            ],
            user: "@user3",
            caption: "Some awesome photos!",
            mask: true
        },
    ]);

    const [currentIndexes, setCurrentIndexes] = useState({}); // { postId: index }

    const handleScroll = (postId, e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const idx = Math.round(scrollLeft / width);
        setCurrentIndexes((prev) => ({ ...prev, [postId]: idx }));
    };

    return (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory">
          {posts.map((post) => {
            const currentIndex = currentIndexes[post.id] || 0;
            return (
              <div
                key={post.id}
                className="snap-start h-screen flex flex-col justify-center items-center relative"
              >
                {/* Video post */}
                {post.type === "video" && (
                  <video
                    src={post.media[0]}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                  />
                )}
    
                {/* Image carousel post */}
                {post.type === "images" && (
                  <div
                    className="w-full h-full overflow-x-scroll snap-x snap-mandatory flex"
                    onScroll={(e) => handleScroll(post.id, e)}
                  >
                    {post.media.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt={`post-${post.id}-${idx}`}
                        className="snap-center w-full h-full object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
    
                {/* Dot indicators for image carousel */}
                {post.type === "images" && (
                  <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
                    {post.media.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          currentIndex === idx ? "bg-white" : "bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
    
                <div className="absolute bottom-24 left-4 text-white flex flex-col items-start space-y-2">
                    {/* Hover Unlock Button */}
                    
                    <button className="flex items-center gap-2 bg-white bg-opacity-70 px-3 py-1 rounded shadow-lg font-semibold">
                        <Lock className="w-5 h-5 text-black" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EE1D52] to-[#69C9D0]">
                        Click to unlock
                        </span>
                    </button>

                    {/* Username / Caption */}
                    <div className="flex flex-col mt-1">
                        <p className="font-bold">{post.user}</p>
                        <p>{post.caption}</p>
                    </div>
                </div>
    
                {/* Action buttons */}
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
            );
          })}
        </div>
    );
}

export default MediaFeed