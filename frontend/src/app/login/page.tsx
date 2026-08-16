'use client';

import { Suspense } from 'react';
import { LoginScreen } from '../../components/LoginScreen';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
          กำลังโหลดหน้าเข้าสู่ระบบ...
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
