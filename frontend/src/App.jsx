import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DraftsProvider } from './contexts/DraftsContext'
import ForYouPage from './pages/ForYouPage'
import UploadPage from './pages/UploadPage'
import AllImagesOverviewPage from './pages/AllPrivacyOverviewPage'
import PrivacyOverviewPage from './pages/PrivacyOverviewPage'
import EditMaskPage from './pages/EditMaskPage'

function App() {
  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="relative w-[390px] h-screen bg-black">
        <DraftsProvider>
          <Router>
            <Routes>
              <Route path="/" element={<ForYouPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/all-drafts" element={<AllImagesOverviewPage />} />
              <Route path="/privacy-overview" element={<PrivacyOverviewPage />} />
              <Route path="/edit-mask" element={<EditMaskPage />} />
            </Routes>
          </Router>
        </DraftsProvider>
      </div>
    </div>
  )
}

export default App
