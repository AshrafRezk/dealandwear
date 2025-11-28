import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import MobileNav from './components/Layout/MobileNav';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Search from './pages/Search';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <MobileNav />
      </div>
    </Router>
  );
}

export default App;
