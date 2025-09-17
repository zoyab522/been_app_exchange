// export default App
import { Routes, Route } from 'react-router-dom'
import MapView from './pages/MapView'
import TimelineView from './pages/TimelineView'
import Login from './pages/Login'
import WelcomePopup from './components/WelcomePopup'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<MapView />} />
        <Route path='/timeline' element={<TimelineView />} />
        <Route path='/login' element={<Login />} />
      </Routes>
      <WelcomePopup />
    </>
  )
}

export default App;