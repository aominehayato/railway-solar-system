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

// Pipedが全滅のため、Invidious APIに切り替え
const INSTANCES = [
    'https://invidious.privacydev.net',
    'https://invidious.nerdvpn.de'
];

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    for (const base of INSTANCES) {
        try {
            const data = await new Promise((resolve, reject) => {
                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
                        'Accept': 'application/json'
                    },
                    timeout: 4000
                };
                const request = https.get(`${base}/api/v1/videos/${videoId}`, options, (apiRes) => {
                    let body = '';
                    apiRes.on('data', chunk => body += chunk);
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 200) resolve(JSON.parse(body));
                        else reject(new Error('Blocked'));
                    });
                });
                request.on('error', reject);
                request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
            });

            // Invidiousのストリーム形式から抽出
            const stream = data.formatStreams.find(f => f.type.includes('mp4')) || data.formatStreams[0];
            return res.json({ success: true, title: data.title, streamUrl: stream.url });
        } catch (e) { continue; }
    }
    res.status(500).json({ error: 'All instances exhausted.' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
