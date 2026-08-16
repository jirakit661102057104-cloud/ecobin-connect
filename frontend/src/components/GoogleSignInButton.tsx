'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { GOOGLE_CLIENT_ID } from '../lib/config';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback?: (res: { credential: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            login_uri?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            el: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ecobin-gis="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('โหลด Google Sign-In ไม่สำเร็จ')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.ecobinGis = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('โหลด Google Sign-In ไม่สำเร็จ'));
    document.head.appendChild(s);
  });
}

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => Promise<void>;
  busy?: boolean;
  mode: 'login' | 'register';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, busy, mode }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api<{ enabled: boolean; client_id: string }>('/api/auth/google/config');
        if (!cancelled && cfg.client_id) setClientId(cfg.client_id);
      } catch {
        // keep NEXT_PUBLIC fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !hostRef.current) {
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;
        hostRef.current.innerHTML = '';
        const loginUri = `${window.location.origin}/login`;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'redirect',
          login_uri: loginUri,
          cancel_on_tap_outside: true,
          callback: async (res) => {
            if (res.credential) await callbackRef.current(res.credential);
          },
        });
        window.google.accounts.id.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'pill',
          width: 336,
          locale: 'th',
        });
        setReady(true);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'เปิด Google Sign-In ไม่ได้');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className={`flex justify-center min-h-11 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
        <div ref={hostRef} />
      </div>
      {!ready && !error && (
        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          กำลังโหลด Google Sign-In...
        </p>
      )}
      {error && <p className="text-[11px] text-rose-600 text-center">{error}</p>}
    </div>
  );
};
