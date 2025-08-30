import { Home, Search, Inbox, User, Upload } from "lucide-react";
import { Link } from "react-router-dom"

function BottomNav() {
    return (
        <div 
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] text-gray-400 flex justify-around items-center py-2"
            style={{ backgroundColor: "black" }}
        >
            <button className="flex flex-col items-center space-y-1 text-white">
                <Home fill="white" className="w-6 h-6" />
                <span className="text-xs">Home</span>
            </button>

            <button className="flex flex-col items-center space-y-1">
                <Search className="w-6 h-6" />
                <span className="text-xs">Discover</span>
            </button>

            <Link to="/upload" className="flex flex-col items-center space-y-1 text-gray-400">
                <Upload className="w-6 h-6" />
                <span className="text-xs">Upload</span>
            </Link>

            <button className="flex flex-col items-center space-y-1">
                <Inbox className="w-6 h-6" />
                <span className="text-xs">Inbox</span>
            </button>
            
            <button className="flex flex-col items-center space-y-1">
                <User className="w-6 h-6" />
                <span className="text-xs">Profile</span>
            </button>
        </div>
    );
}

export default BottomNav