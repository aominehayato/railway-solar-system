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

// 安定している Invidious インスタンス
const API_URL = 'https://invidious.nerdvpn.de';

app.get('/api/bypass-stream', (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    https.get(`${API_URL}/api/v1/videos/${videoId}`, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (c) => data += c);
        proxyRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                // adaptiveFormatsの中から動画ストリームURLを取得
                const format = json.adaptiveFormats?.find(f => f.type.includes('video/mp4'));
                if (!format) throw new Error('No stream found');
                
                res.json({ success: true, title: json.title, streamUrl: format.url });
            } catch (e) {
                res.status(500).json({ error: 'Extraction failed: ' + e.message });
            }
        });
    }).on('error', (e) => res.status(500).json({ error: e.message }));
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
