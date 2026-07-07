import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

// 汎用的な動画ファイル(.mp4等)をCORS回避して中継するプロキシAPI
app.get('/api/stream', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const client = videoUrl.startsWith('https') ? https : http;

        // 指定された動画URLへサーバーからリクエストを送信
        client.get(videoUrl, (streamResponse) => {
            // ステータスコードが正常（200番台）であることを確認
            if (streamResponse.statusCode >= 400) {
                return res.status(streamResponse.statusCode).send('Failed to fetch video file from remote server');
            }

            // 元の動画サーバーが返してきたContent-Type（video/mp4など）をそのまま引き継ぐ
            res.setHeader('Content-Type', streamResponse.headers['content-type'] || 'video/mp4');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // データをリアルタイムでブラウザへ中継（パイプ転送）
            streamResponse.pipe(res);
        }).on('error', (e) => {
            console.error('Proxy request error:', e);
            res.status(500).send(`Proxy error: ${e.message}`);
        });

    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).send(`Error streaming video: ${error.message}`);
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
