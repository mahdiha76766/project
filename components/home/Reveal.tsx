'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
};

export function Reveal({ children, className, delay = 0, direction = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'reveal transition-all duration-700 ease-out',
        visible && 'reveal-visible',
        !visible && direction === 'up' && 'translate-y-8 opacity-0',
        !visible && direction === 'down' && '-translate-y-8 opacity-0',
        !visible && direction === 'left' && 'translate-x-8 opacity-0',
        !visible && direction === 'right' && '-translate-x-8 opacity-0',
        !visible && direction === 'scale' && 'scale-95 opacity-0',
        visible && 'translate-x-0 translate-y-0 scale-100 opacity-100',
        className
      )}
    >
      {children}
    </div>
  );
}
