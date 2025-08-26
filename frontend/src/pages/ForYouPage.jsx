import BottomNav from '../components/BottomNav'
import VideoFeed from '../components/videoFeed'

function ForYouPage() {
    return (
        <div className="relative h-screen bg-black overflow-hidden">
            <VideoFeed />
            <BottomNav />
        </div>
    )
}

export default ForYouPage