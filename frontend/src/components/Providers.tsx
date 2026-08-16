'use client';

import type { ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { ToastContainer } from './ToastContainer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <ToastContainer />
    </AppProvider>
  );
}
