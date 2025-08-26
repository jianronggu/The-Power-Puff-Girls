import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ForYouPage from './pages/ForYouPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="relative w-[390px] h-screen bg-black">
        <Router>
          <Routes>
            <Route path="/" element={<ForYouPage />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
