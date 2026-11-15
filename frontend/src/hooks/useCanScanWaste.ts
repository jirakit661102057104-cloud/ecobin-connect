'use client';

import { useEffect, useState } from 'react';
import { isSmartphoneClient } from '../lib/device';

/** true = device may open WasteScanner */
export function useCanScanWaste() {
  const [canScan, setCanScan] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      setCanScan(isSmartphoneClient());
      setReady(true);
    };
    update();
    window.addEventListener('resize', update);
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mq.removeEventListener?.('change', update);
    };
  }, []);

  return { canScan, ready };
}
