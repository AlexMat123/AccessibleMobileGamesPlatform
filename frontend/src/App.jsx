import './App.css'
import Home from "./pages/Home";
import Search from "./pages/Search";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Game from "./pages/Game.jsx";
import Library from "./pages/Library.jsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/games/:id" element={<Game/>} />
        <Route path="/Library" element={<Library/>} />
      </Routes>
    </Router>
  );
}

export default App;