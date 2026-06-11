import { config } from 'dotenv';
config({ path: '.env.local' });
import { createServer } from 'http';
import { processWebhook } from 'corsair';
import { corsair } from './corsair';

// Create a minimal Node.js HTTP server to simulate a webhook receiver endpoint
const server = createServer((req, res) => {
    // We only care about POST requests to /webhook
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        // Accumulate chunks of data as they come in
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // When the entire request body is received
        req.on('end', async () => {
            try {
                console.log('\n--- Incoming Webhook Received ---');
                console.log('Headers:', req.headers);
                console.log('Raw Body:', body);
                
                // Pass the instance, headers, and body to Corsair's native webhook processor
                // Corsair automatically verifies signatures and updates the database!
                await processWebhook(corsair, req.headers as Record<string, string>, body);
                
                console.log('✅ Webhook successfully processed by Corsair');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Webhook processed successfully\n');
            } catch (err) {
                console.error('❌ Failed to process webhook:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Webhook processing failed\n');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found. Send POST to /webhook\n');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Webhook test server listening on http://localhost:${PORT}`);
    console.log(`\nTo test this, open a new terminal and run:`);
    console.log(`curl -X POST http://localhost:${PORT}/webhook -H "Content-Type: application/json" -d '{"dummy": "payload"}'`);
});
