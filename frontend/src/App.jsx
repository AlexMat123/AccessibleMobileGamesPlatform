import './App.css'
import Home from "./pages/Home";
import Search from "./pages/Search";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Game from "./pages/Game.jsx";
import ToastHost from './components/ToastHost.jsx';



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search" element={<Search />} />
        <Route path="/games/:id" element={<Game/>} />
      </Routes>
      <ToastHost />
    </Router>
  );
}

export default App;