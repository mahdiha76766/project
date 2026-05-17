(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '09120000000', password: 'password123', name: 'Test', email: 'test@example.com' })
    });
    console.log('STATUS', res.status);
    console.log(await res.text());
  } catch (e) {
    console.error('REQUEST ERROR', e);
    process.exit(1);
  }
})();
