import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-surface-600">در حال بارگذاری...</div>}>
      <LoginForm />
    </Suspense>
  );
}
