import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { HelioVector, Body } from 'astronomy-engine';
import ytdl from '@distube/ytdl-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

// 1. YouTube独自ストリーミング配信用API
app.get('/api/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        // 動画のメタ情報を取得し、適切な動画・音声フォーマットを選択
        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });

        // ブラウザ側に動画ストリームであることを伝えるヘッダーを設定
        res.setHeader('Content-Type', 'video/mp4');
        
        // YouTubeから直接データを取得しながら、ブラウザにリアルタイム転送（独自配信）
        ytdl(videoUrl, { format: format }).pipe(res);
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).send('Error streaming video');
    }
});

// 2. 太陽系天体計算ロジック
const planets = [
    { name: 'Mercury', body: Body.Mercury },
    { name: 'Venus', body: Body.Venus },
    { name: 'Earth', body: Body.Earth },
    { name: 'Mars', body: Body.Mars },
    { name: 'Jupiter', body: Body.Jupiter },
    { name: 'Saturn', body: Body.Saturn },
    { name: 'Uranus', body: Body.Uranus },
    { name: 'Neptune', body: Body.Neptune }
];

function getPlanetPositions() {
    const now = new Date();
    const data = {
        time: now.toISOString(),
        planets: {}
    };

    planets.forEach(p => {
        const vec = HelioVector(p.body, now);
        data.planets[p.name] = {
            x: vec.x,
            y: vec.y,
            z: vec.z
        };
    });

    return data;
}

wss.on('connection', (ws) => {
    ws.send(JSON.stringify(getPlanetPositions()));

    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(getPlanetPositions()));
        }
    }, 1000);

    ws.on('close', () => {
        clearInterval(interval);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
