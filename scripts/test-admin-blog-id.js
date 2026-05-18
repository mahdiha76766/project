const crypto = require('crypto');

function base64urlEncode(input) {
  if (Buffer.from) {
    return Buffer.from(input).toString('base64url');
  }
  const b64 = Buffer.from(input).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(payload, secret = process.env.AUTH_SECRET || 'dev-secret-change-me') {
  const data = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

async function main() {
  const baseUrl = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000';
  const id = process.argv[3] || process.env.BLOG_ID || '000000000000000000000000';
  const token = signToken({ userId: 'test-admin', role: 'ADMIN', mobile: '0000000000' });
  const cookie = `session_token=${token}`;

  console.log('Base URL:', baseUrl);
  console.log('Blog ID:', id);

  // PUT request
  const putBody = {
    title: 'Integration Test Update',
    content: 'This is a test content with more than 20 characters to satisfy validation.',
    tags: ['test', 'api']
  };

  try {
    const putRes = await fetch(`${baseUrl}/api/admin/blog/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookie
      },
      body: JSON.stringify(putBody)
    });
    console.log('\nPUT', putRes.status);
    const putText = await putRes.text();
    console.log(putText);
  } catch (err) {
    console.error('PUT request failed:', err);
  }

  // DELETE request
  try {
    const delRes = await fetch(`${baseUrl}/api/admin/blog/${id}`, {
      method: 'DELETE',
      headers: { 'cookie': cookie }
    });
    console.log('\nDELETE', delRes.status);
    const delText = await delRes.text();
    console.log(delText);
  } catch (err) {
    console.error('DELETE request failed:', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
