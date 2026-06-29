'use client';

import { useEffect } from 'react';

export function CronInit() {
  useEffect(() => {
    // Only fetch once
    fetch('/api/admin/backups/init', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}
