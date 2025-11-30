import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import CoachLogin from './pages/CoachLogin';
import CoachDashboard from './pages/CoachDashboard';
import CoachPanel from './pages/CoachPanel';
import StudentDetails from './pages/StudentDetails';
import StudentLogin from './pages/StudentLogin';
import StudentPanel from './pages/StudentPanel';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/coach/login" replace />} />
          <Route path="/coach/login" element={<CoachLogin />} />
          <Route path="/coach/dashboard" element={<CoachDashboard />} />
          <Route path="/coach/student/:studentId" element={<StudentDetails />} />
          <Route path="/student" element={<StudentLogin />} />
          <Route path="/student/panel" element={<StudentPanel />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
