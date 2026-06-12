import http from 'http';

http.get('http://localhost:3000/api/test-modify', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Result:', body));
});
