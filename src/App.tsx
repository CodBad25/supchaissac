import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StyleguidePage from './pages/StyleguidePage';

function App() {
  return (
    <Router>
      <div className="App overflow-x-hidden w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/styleguide" element={<StyleguidePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;