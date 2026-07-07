import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'dist')));

// 応答率の高いもののみを厳選
const PIPED_APIS = [
    'https://pipedapi.adminforge.de',
    'https://pipedapi.lunar.icu'
];

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    for (const apiBase of PIPED_APIS) {
        try {
            const data = await new Promise((resolve, reject) => {
                const reqOptions = {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Referer': 'https://www.google.com/'
                    },
                    timeout: 5000
                };
                const request = https.get(`${apiBase}/streams/${videoId}`, reqOptions, (apiRes) => {
                    let body = '';
                    apiRes.on('data', chunk => body += chunk);
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 200) resolve(JSON.parse(body));
                        else reject(new Error('Status ' + apiRes.statusCode));
                    });
                });
                request.on('error', reject);
                request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
            });
            return res.json({ success: true, title: data.title, streamUrl: data.videoStreams[0].url });
        } catch (e) { continue; }
    }
    res.status(500).json({ error: 'All instances blocked.' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
