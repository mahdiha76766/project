'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'site_visitor_id';
const SESSION_KEY = 'site_session_id';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getIds() {
  if (typeof window === 'undefined') return { visitorId: '', sessionId: '' };
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = uid();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uid();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return { visitorId, sessionId };
}

function maxScrollDepth() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const viewport = window.innerHeight;
  const height = Math.max(doc.scrollHeight, 1);
  return Math.min(100, Math.round(((scrollTop + viewport) / height) * 100));
}

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const pageViewIdRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(Date.now());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const { visitorId, sessionId } = getIds();
    let cancelled = false;
    enteredAtRef.current = Date.now();
    pageViewIdRef.current = null;

    const send = async (payload: Record<string, unknown>) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } catch {
        // ignore tracking errors
      }
    };

    const start = async () => {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pageview',
          sessionId,
          visitorId,
          path: pathname,
          title: document.title,
          referrer: document.referrer || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!cancelled && data.pageViewId) pageViewIdRef.current = data.pageViewId;
    };

    void start();

    heartbeatRef.current = setInterval(() => {
      if (!pageViewIdRef.current) return;
      const durationSec = Math.round((Date.now() - enteredAtRef.current) / 1000);
      void send({
        type: 'heartbeat',
        sessionId,
        pageViewId: pageViewIdRef.current,
        durationSec,
        scrollDepth: maxScrollDepth()
      });
    }, 30000);

    const onLeave = () => {
      if (!pageViewIdRef.current) return;
      const durationSec = Math.round((Date.now() - enteredAtRef.current) / 1000);
      void send({
        type: 'leave',
        sessionId,
        pageViewId: pageViewIdRef.current,
        durationSec,
        scrollDepth: maxScrollDepth()
      });
    };

    const onHide = () => {
      if (document.visibilityState === 'hidden') onLeave();
    };

    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onHide);
      onLeave();
    };
  }, [pathname]);

  return null;
}
