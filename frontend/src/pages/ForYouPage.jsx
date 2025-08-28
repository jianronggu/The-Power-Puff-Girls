import BottomNav from '../components/BottomNav'
import MediaFeed from '../components/MediaFeed'

function ForYouPage() {
    return (
        <div className="relative h-screen bg-black overflow-hidden">
            <MediaFeed />
            <BottomNav />
        </div>
    )
}

export default ForYouPage