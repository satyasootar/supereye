'use client';

import { useEffect, useState } from 'react';
import { DemoLoginButton } from '@/components/auth/demo-login-button';

export function DemoLoginGate() {
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/demo-login-status')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { enabled?: boolean }) => {
        if (!cancelled) {
          setEnabled(data.enabled === true);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnabled(false);
          setChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked || !enabled) {
    return null;
  }

  return <DemoLoginButton />;
}
