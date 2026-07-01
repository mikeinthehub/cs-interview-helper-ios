import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { IOSShell } from './components/layout/IOSShell';
import { ToastContainer } from './components/shared/Toast';
import { SetupPage } from './pages/SetupPage';
import { InterviewPage } from './pages/InterviewPage';
import { ReportPage } from './pages/ReportPage';

export default function App() {
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      document.documentElement.classList.toggle('ios-dark', prefersDark.matches);
    };
    applyTheme();
    prefersDark.addEventListener('change', applyTheme);
    return () => prefersDark.removeEventListener('change', applyTheme);
  }, []);

  return (
    <BrowserRouter>
      <IOSShell>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </IOSShell>
      <ToastContainer />
    </BrowserRouter>
  );
}
