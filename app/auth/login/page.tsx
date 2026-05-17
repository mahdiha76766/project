export default function LoginPage() {
  return <main className="mx-auto max-w-md p-6"><h1 className="mb-4 text-2xl font-bold">ورود</h1><form action="/api/auth/login" method="post" className="space-y-3"><input name="mobile" placeholder="شماره موبایل" className="w-full rounded border p-2" /><input name="password" type="password" placeholder="رمز عبور" className="w-full rounded border p-2" /><button className="w-full rounded bg-amber-800 p-2 text-white">ورود</button></form></main>;
}
