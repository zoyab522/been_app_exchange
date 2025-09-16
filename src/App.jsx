// export default App
import { Routes, Route } from 'react-router-dom'
import MapView from './pages/MapView'
import TimeLineView from './pages/TimeLineView'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path='/' element={<MapView />} />
      <Route path='/timeline' element={<TimeLineView />} />
      <Route path='/login' element={<Login />} />
    </Routes>
  )
}

export default App;