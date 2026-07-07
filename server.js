import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import ytdl from '@distube/ytdl-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'ID required' });

    try {
        const info = await ytdl.getInfo(videoId);
        // 音声付きの高品質ストリームを自動選択
        const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo', quality: 'highest' });
        
        res.json({ 
            success: true, 
            title: info.videoDetails.title, 
            streamUrl: format.url 
        });
    } catch (e) {
        res.status(500).json({ error: 'Direct stream extraction failed.' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
