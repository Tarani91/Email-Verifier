import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import KnownEmails from './pages/KnownEmails';

export default function App() {
  const [activeTab, setActiveTab] = useState('verify');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-[Inter]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1">
        {activeTab === 'verify' && <Home />}
        {activeTab === 'history' && <History />}
        {activeTab === 'known' && <KnownEmails />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>VerifyPulse © 2026 — Production Open-Source Email Verification Platform.</p>
      </footer>
    </div>
  );
}
