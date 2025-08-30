import { useState } from 'react'
import { Heart, MessageCircle, Bookmark, Share2, Lock } from "lucide-react"

const BACKEND = "http://localhost:8000"; // change if needed

function MediaFeed() {
    // TODO: update the posts state and structure
    // const [posts] = useState([
    //     { id: 1, type: "video", media: ["https://www.w3schools.com/html/mov_bbb.mp4"], user: "@user1", caption: "Check out this cool video!", mask: false },
    //     { id: 2, type: "video", media: ["https://www.w3schools.com/html/movie.mp4"], user: "@user2", caption: "Another fun video!", mask: false },
    //     {
    //         id: 3,
    //         type: "images",
    //         media: [
    //           "https://picsum.photos/id/1015/800/1200",
    //           "https://picsum.photos/id/1014/800/1200",
    //           "https://picsum.photos/id/1013/800/1200",
    //         ],
    //         user: "@user3",
    //         caption: "Some awesome photos!",
    //         mask: true
    //     },
    // ]);

    const [posts, setPosts] = useState([]);
    const [currentIndexes, setCurrentIndexes] = useState({}); // { postId: index }
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [unlockTarget, setUnlockTarget] = useState({ postId: null, imageIndex: 0 });

    useEffect(() => {
      const fetchPosts = async () => {
        try {
          const res = await fetch(`${BACKEND}/posts`); // backend URL
          if (!res.ok) throw new Error("Failed to fetch posts");
          const data = await res.json();
  
          // convert backend structure to frontend structure
          const formattedPosts = data.map((post) => ({
            id: post.id,
            type: post.images.length > 1 ? "images" : post.images[0].urlPublic.endsWith(".mp4") ? "video" : "images",
            media: post.images.map((img) => img.urlPublic),
            user: `@user${post.userId}`, // optional formatting
            caption: post.caption || "",
            mask: post.images.some((img) => img.isPrivate),
          }));
  
          setPosts(formattedPosts);
          setLoading(false);
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      };

      fetchPosts();
    }, []);

    const handleScroll = (postId, e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const idx = Math.round(scrollLeft / width);
        setCurrentIndexes((prev) => ({ ...prev, [postId]: idx }));
    };

    const handleUnlockClick = (postId, imageIndex) => {
      setUnlockTarget({ postId, imageIndex });
      setShowModal(true);
    };

    const handleUnlockSubmit = async () => {
      const { postId, imageIndex } = unlockTarget;
  
      try {
        const res = await fetch(`${BACKEND}/posts/open-original`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, imageIndex, password }),
        });
  
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to unlock image");
        }
  
        const { url } = await res.json();
  
        // Update the post in state
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  media: p.media.map((m, idx) => (idx === imageIndex ? url : m)),
                  mask: false,
                }
              : p
          )
        );
  
        setShowModal(false);
        setPassword("");
      } catch (err) {
        alert(err.message);
      }
    };

    if (loading) return <p className="text-white text-center mt-10">Loading posts...</p>;

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
                    className="w-full h-full overflow-x-scroll snap-x snap-mandatory flex items-center justify-center"
                    onScroll={(e) => handleScroll(post.id, e)}
                  >
                    {post.media.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt={`post-${post.id}-${idx}`}
                        className="snap-center max-w-full max-h-full object-contain flex-shrink-0 mx-auto"
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
                    
                    {post.mask && (
                      <button
                        className="flex items-center gap-2 bg-white bg-opacity-70 px-3 py-1 rounded shadow-lg font-semibold"
                        onClick={() => handleUnlockClick(post.id, currentIndex)}
                      >
                        <Lock className="w-5 h-5 text-black" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EE1D52] to-[#69C9D0]">
                          Click to unlock
                        </span>
                      </button>
                    )}

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

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-lg p-6 w-80 relative">
                        <h2 className="text-lg font-semibold mb-4">Enter Password</h2>
                        <div className="flex items-center border rounded-lg px-3 py-2 mb-4">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="flex-1 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        </div>
                        <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUnlockSubmit}
                            className="px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        >
                            Submit
                        </button>
                        </div>
                    </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>
    );
}

export default MediaFeed