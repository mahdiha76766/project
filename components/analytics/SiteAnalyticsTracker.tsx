'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'site_visitor_id';
const SESSION_KEY = 'site_session_data';
const SESSION_IDLE_MS = 30 * 60 * 1000;

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

  let sessionId = '';
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as { id?: string; expires?: number }) : null;
    if (parsed?.id && parsed.expires && parsed.expires > Date.now()) {
      sessionId = parsed.id;
    }
  } catch {
    // ignore corrupt session data
  }

  if (!sessionId) {
    sessionId = uid();
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: sessionId, expires: Date.now() + SESSION_IDLE_MS })
  );

  return { visitorId, sessionId };
}

function touchSession(sessionId: string) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: sessionId, expires: Date.now() + SESSION_IDLE_MS })
  );
}

function maxScrollDepth() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const viewport = window.innerHeight;
  const height = Math.max(doc.scrollHeight, 1);
  return Math.min(100, Math.round(((scrollTop + viewport) / height) * 100));
}

function screenSize() {
  return {
    screenWidth: window.screen?.width || window.innerWidth,
    screenHeight: window.screen?.height || window.innerHeight
  };
}

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const pageViewIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>('');
  const enteredAtRef = useRef<number>(Date.now());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const { visitorId, sessionId } = getIds();
    sessionIdRef.current = sessionId;
    let cancelled = false;
    leavingRef.current = false;
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
      const { screenWidth, screenHeight } = screenSize();
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pageview',
          sessionId,
          visitorId,
          path: pathname,
          title: document.title,
          referrer: document.referrer || '',
          screenWidth,
          screenHeight
        })
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (data.pageViewId) pageViewIdRef.current = data.pageViewId;
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
        touchSession(data.sessionId);
      }
    };

    void start();

    heartbeatRef.current = setInterval(() => {
      if (!pageViewIdRef.current) return;
      touchSession(sessionIdRef.current);
      const durationSec = Math.round((Date.now() - enteredAtRef.current) / 1000);
      void send({
        type: 'heartbeat',
        sessionId: sessionIdRef.current,
        pageViewId: pageViewIdRef.current,
        durationSec,
        scrollDepth: maxScrollDepth()
      });
    }, 30000);

    const onLeave = () => {
      if (!pageViewIdRef.current || leavingRef.current) return;
      leavingRef.current = true;
      const durationSec = Math.round((Date.now() - enteredAtRef.current) / 1000);
      void send({
        type: 'leave',
        sessionId: sessionIdRef.current,
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
