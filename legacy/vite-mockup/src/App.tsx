import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MemberDashboard } from './components/MemberDashboard';
import { WasteScanner } from './components/WasteScanner';
import { RewardsCatalog } from './components/RewardsCatalog';
import { PlasticGuide } from './components/PlasticGuide';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { 
  GraduationCap, 
  Recycle, 
  Leaf, 
  Sparkles, 
  BookOpen, 
  Heart,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function MainAppContent() {
  const { currentRole, currentUser, language } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/60 via-slate-50 to-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={() => setIsAuthOpen(true)}
        openResearchModal={() => setIsResearchOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <MemberDashboard 
                setActiveTab={setActiveTab} 
                openAuthModal={() => setIsAuthOpen(true)} 
              />
            )}

            {activeTab === 'scan' && (
              <WasteScanner 
                onSuccessNavigate={(tab) => setActiveTab(tab)} 
                openAuthModal={() => setIsAuthOpen(true)} 
              />
            )}

            {activeTab === 'rewards' && (
              <RewardsCatalog 
                openAuthModal={() => setIsAuthOpen(true)}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'guide' && (
              <PlasticGuide />
            )}

            {activeTab === 'history' && (
              <HistoryView />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                setActiveTab={setActiveTab}
                openAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'admin' && (
              currentRole === 'Admin' ? (
                <AdminPanel />
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto border border-slate-200 shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'th' ? 'เฉพาะผู้ดูแลระบบ (Admin)' : 'Admin Access Only'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'th' 
                      ? 'หน้านี้สำหรับอาจารย์และผู้ดูแลระบบเท่านั้น กรุณาสลับบทบาทเป็นบัญชีผู้ดูแลระบบ "จิรกิตติ์" ในเมนูด้านบน'
                      : 'This page is restricted to administrators. Please switch to the "Jirakit" admin account.'}
                  </p>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Clean Modern Footer */}
      <footer className="bg-white border-t border-slate-100 mt-auto py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">
              <Recycle className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-800 text-xs">EcoBin PCRU</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">Green Campus & Smart Recycling</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{language === 'th' ? 'มรภ.เพชรบูรณ์' : 'PCRU'}</span>
            <span>•</span>
            <button
              onClick={() => setIsResearchOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
            >
              {language === 'th' ? 'เกี่ยวกับโครงการ' : 'About Project'}
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ResearchInfoModal isOpen={isResearchOpen} onClose={() => setIsResearchOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
