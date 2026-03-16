import './App.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
            <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Contact Us</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>About Us</NavLink>
            <div className="nav-spacer"></div>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active nav-register' : 'nav-link nav-register'}>Sign Up</NavLink>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
