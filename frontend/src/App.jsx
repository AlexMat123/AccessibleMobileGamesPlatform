import './App.css'
import Home from "./pages/Home";
import Game from "./pages/Game.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/games/:id" element={<Game/>} />
            </Routes>
        </Router>
    );
}

export default App;