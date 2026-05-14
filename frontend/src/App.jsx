import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DSA from './pages/DSA';
import Skills from './pages/Skills';
import ApexBank from './pages/ApexBank';
import Certifications from './pages/Certifications';
import Goals from './pages/Goals';
import Journal from './pages/Journal';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import { api } from './utils/api';

export default function App() {
  const [assessmentDone, setAssessmentDone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssessmentStatus()
      .then(data => { setAssessmentDone(data.done); })
      .catch(() => setAssessmentDone(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0F]">
        <div className="text-center">
          <div className="text-4xl font-mono text-[#00FF9C] mb-4 animate-pulse">⚡</div>
          <div className="text-[#00FF9C] font-mono text-sm animate-pulse">Booting Learning OS...</div>
        </div>
      </div>
    );
  }

  if (!assessmentDone) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#12121A', color: '#E0E0E0', border: '1px solid #1E1E2E' } }} />
        <Onboarding onComplete={() => setAssessmentDone(true)} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121A', color: '#E0E0E0', border: '1px solid #1E1E2E' } }} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dsa" element={<DSA />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/apexbank" element={<ApexBank />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
