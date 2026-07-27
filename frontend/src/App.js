// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import InteractiveBackground from './components/InteractiveBackground';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import RecommendPage from './pages/RecommendPage';
import BrowsePage from './pages/BrowsePage';
import TimeOfDayPage from './pages/TimeOfDayPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <InteractiveBackground />
      <Router>
        <Routes>
          {/* Login — full-screen, no navbar/footer */}
          <Route path="/login" element={<LoginPage />} />

          {/* All other routes — protected, with Navbar + Footer */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-shell">
                  <Navbar />
                  <main className="app-main">
                    <Routes>
                      <Route path="/"            element={<HomePage />} />
                      <Route path="/dashboard"   element={<DashboardPage />} />
                      <Route path="/movie/:id"   element={<MovieDetailPage />} />
                      <Route path="/recommend"   element={<RecommendPage />} />
                      <Route path="/browse"      element={<BrowsePage />} />
                      <Route path="/time"        element={<TimeOfDayPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
