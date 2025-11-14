import './App.css'
import Home from "./pages/Home";
import Search from "./pages/Search";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Game from "./pages/Game.jsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/games/:id" element={<Game/>} />
      </Routes>
    </Router>
  );
}

export default App;