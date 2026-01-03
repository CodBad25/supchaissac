import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ActivatePage from './pages/ActivatePage';
import TeacherDashboard from './pages/TeacherDashboard';
import SecretaryDashboard from './pages/SecretaryDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import StyleguidePage from './pages/StyleguidePage';

function App() {
  return (
    <Router>
      <div className="App overflow-x-hidden w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/secretary" element={<SecretaryDashboard />} />
          <Route path="/principal" element={<PrincipalDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/styleguide" element={<StyleguidePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;