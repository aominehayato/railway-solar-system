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
        const info = await ytdl.getInfo(videoId); // agentなしでまずは試す
        const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo', quality: 'highest' });
        
        res.json({ 
            success: true, 
            title: info.videoDetails.title, 
            streamUrl: format.url 
        });
    } catch (e) {
        console.error('YTDL Error:', e.message);
        res.status(500).json({ error: 'Extraction failed: ' + e.message });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
server.listen(PORT, '0.0.0.0');
