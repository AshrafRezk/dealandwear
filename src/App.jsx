import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import MobileNav from './components/Layout/MobileNav';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Search from './pages/Search';
import Swipe from './pages/Swipe';
import DataHub from './pages/DataHub';
import Brands from './pages/Brands';
import Remix from './pages/Remix'; // New route
import Saved from './pages/Saved'; // New route
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <main className="main-content">
            <Routes>
              {/* Public Route (Landing / Auth) */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/swipe" element={<Swipe />} />
                <Route path="/datahub" element={<DataHub />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/stories" element={<Remix />} />
                <Route path="/saved" element={<Saved />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
