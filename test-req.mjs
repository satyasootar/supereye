import http from 'http';

const data = JSON.stringify({
  tenant_id: '1',
  plugin: 'gmail',
  action: 'new_message'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/corsair',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
