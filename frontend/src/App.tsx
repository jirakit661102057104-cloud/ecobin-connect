'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MemberDashboard } from './components/MemberDashboard';
import { WasteScanner } from './components/WasteScanner';
import { RewardsCatalog } from './components/RewardsCatalog';
import { PlasticGuide } from './components/PlasticGuide';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AdminPanel } from './components/AdminPanel';
import { AdminQRScanner } from './components/AdminQRScanner';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { BrandLogo } from './components/BrandLogo';
import { isGuestBrowse } from './lib/config';
import { persistMainTab, restoreMainTab, allowedMainTabs, defaultMainTab } from './lib/navState';
import {
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function MainAppContent() {
  const router = useRouter();
  const { currentRole, language, currentUser, authReady } = useApp();
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const openLogin = () => router.push('/login');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    persistMainTab(tab, currentUser?.user_id, currentRole);
  };

  useEffect(() => {
    if (!authReady) return;
    const restored = restoreMainTab(currentRole, currentUser?.user_id);
    const allowed = allowedMainTabs(currentRole);
    setActiveTabState(allowed.includes(restored) ? restored : defaultMainTab(currentRole));
  }, [authReady, currentUser?.user_id, currentRole]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser && !isGuestBrowse()) {
      router.replace('/login');
    }
  }, [authReady, currentUser, router]);

  if (!authReady || (!currentUser && !isGuestBrowse())) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 px-5 py-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          กำลังไปหน้าเข้าสู่ระบบ...
        </div>
      </div>
    );
  }

  return (
    <div className="eco-shell min-h-screen flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={openLogin}
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
                openAuthModal={openLogin} 
              />
            )}

            {activeTab === 'scan' && (
              currentRole === 'Admin' ? (
                <AdminQRScanner />
              ) : (
                <WasteScanner 
                  onSuccessNavigate={(tab) => setActiveTab(tab)} 
                  openAuthModal={openLogin} 
                />
              )
            )}

            {activeTab === 'rewards' && (
              <RewardsCatalog 
                openAuthModal={openLogin}
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
                openAuthModal={openLogin}
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
                      ? 'หน้านี้สำหรับอาจารย์และผู้ดูแลระบบเท่านั้น'
                      : 'This page is restricted to administrators.'}
                  </p>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Clean Modern Footer */}
      <footer className="mt-auto py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eco-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-slate-800 text-xs tracking-tight">EcoBin PCRU</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">Green Campus & Smart Recycling</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{language === 'th' ? 'มรภ.เพชรบูรณ์' : 'PCRU'}</span>
            <span>•</span>
            <button
              onClick={() => setIsResearchOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors cursor-pointer"
            >
              {language === 'th' ? 'เกี่ยวกับโครงการ' : 'About Project'}
            </button>
          </div>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <ResearchInfoModal isOpen={isResearchOpen} onClose={() => setIsResearchOpen(false)} />
      {currentUser?.needs_profile && <CompleteProfileModal />}

    </div>
  );
}

export default function App() {
  return <MainAppContent />;
}
