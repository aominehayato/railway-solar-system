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

// 複数の Invidious インスタンスをリスト化
const INSTANCES = [
    'invidious.nerdvpn.de',
    'yewtu.be',
    'inv.nadeko.net'
];

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    for (const instance of INSTANCES) {
        try {
            const result = await fetchFromInvidious(instance, videoId);
            return res.json({ success: true, title: result.title, streamUrl: result.streamUrl });
        } catch (e) {
            console.error(`Failed with ${instance}: ${e.message}`);
            continue; // 次のインスタンスを試す
        }
    }
    res.status(500).json({ error: 'All instances failed' });
});

function fetchFromInvidious(instance, id) {
    return new Promise((resolve, reject) => {
        https.get(`https://${instance}/api/v1/videos/${id}`, { timeout: 5000 }, (r) => {
            let b = '';
            r.on('data', c => b += c);
            r.on('end', () => {
                if (r.statusCode !== 200) return reject(new Error('Status ' + r.statusCode));
                const json = JSON.parse(b);
                const format = json.adaptiveFormats?.find(f => f.type.includes('video/mp4'));
                if (!format) return reject(new Error('No stream'));
                resolve({ title: json.title, streamUrl: format.url });
            });
        }).on('error', reject);
    });
}

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
