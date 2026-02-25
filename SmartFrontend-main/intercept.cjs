const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        if (body) {
            fs.appendFileSync('/Users/youssefafifi/Desktop/SmartStock_backend-main/SmartFrontend-main/403_intercept.log', body + '\n');
            console.log('Intercepted:', body);
        }
        res.end('OK');
    });
}).listen(9999, () => console.log('Listening on 9999'));
