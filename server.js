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

// 安定した Piped インスタンス
const PIPED_API = 'https://piped.projectsegfau.lt';

app.get('/api/bypass-stream', (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    https.get(`${PIPED_API}/streams/${videoId}`, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => data += chunk);
        proxyRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                // ストリームURLの中で最も品質の高いものを取得
                const streamUrl = json.videoStreams?.[0]?.url;
                if (!streamUrl) throw new Error('No stream found');
                
                res.json({ success: true, title: json.title, streamUrl: streamUrl });
            } catch (e) {
                res.status(500).json({ error: 'Extraction failed: ' + e.message });
            }
        });
    }).on('error', (e) => {
        res.status(500).json({ error: 'Proxy error: ' + e.message });
    });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
