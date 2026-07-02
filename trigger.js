import fetch from 'node-fetch';

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'info@kcglobed.com', password: 'info@kcglobed.com' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  await fetch('http://localhost:3000/api/v1/notifications', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      title: 'Global Hello',
      message: 'This is a global push',
      type: 'INFO',
      isGlobal: true
    })
  });
  console.log('Emitted Global');

  await fetch('http://localhost:3000/api/v1/notifications', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      title: 'Admin Hello',
      message: 'This is an admin push',
      type: 'ALERT',
      isGlobal: false,
      targetRoles: ['SUPER_ADMIN']
    })
  });
  console.log('Emitted Admin');
}
run();
