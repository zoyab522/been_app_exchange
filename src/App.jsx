// export default App
import { Routes, Route } from 'react-router-dom'
import MapView from './pages/MapView'
import TimelineView from './pages/TimelineView'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path='/' element={<MapView />} />
      <Route path='/timeline' element={<TimelineView />} />
      <Route path='/login' element={<Login />} />
    </Routes>
  )
}

export default App;