import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/mail/1900c4e7ab2f6c03/read',
  method: 'POST'
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

req.end();
