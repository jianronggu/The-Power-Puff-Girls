function LoaderPage() {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4"></div>
        <p className="text-lg">Analyzing your content for privacy risks...</p>
      </div>
    );
}
  
export default LoaderPage