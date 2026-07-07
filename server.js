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

app.use(express.static(path.join(__dirname, 'public')));

// YouTubeから動画ストリームを自前サーバー経由で再構成して配信するAPI
app.get('/api/stream', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Missing url parameter');
    }

    // Shortsやモバイル用URLの形式を標準のwatch形式にパース
    if (videoUrl.includes('/shorts/')) {
        videoUrl = videoUrl.replace('/shorts/', '/watch?v=');
    } else if (videoUrl.includes('youtu.be/')) {
        const id = videoUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
        videoUrl = `https://www.youtube.com/watch?v=${id}`;
    }

    try {
        // YouTubeのサーバーに偽装ヘッダーを送信してブロックを回避
        const requestOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        };

        const info = await ytdl.getInfo(videoUrl, { requestOptions });

        // 映像と音声が1つのファイルになっているフォーマット（360pまたは720pなど、ブラウザが直接再生可能なもの）を最優先で選択
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highest',
            filter: 'videoandaudio' // これが重要。音と映像が分離していない形式を狙う
        });

        if (!format) {
            return res.status(404).send('No compatible format found');
        }

        // ブラウザに対して「これは自分（Railway）のサーバーにある動画ですよ」と偽装・宣言する
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Cache-Control', 'no-cache');

        // YouTubeから流れてくる生データをそのまま自分のサーバーの出力にパイプ（リアルタイム転送）
        const stream = ytdl(videoUrl, {
            format: format,
            requestOptions
        });

        stream.on('error', (streamErr) => {
            console.error('Playback stream error:', streamErr);
            if (!res.headersSent) {
                res.status(500).send('Stream transmission failed');
            }
        });

        stream.pipe(res);

    } catch (error) {
        console.error('Streaming API Error:', error);
        res.status(500).send(`Failed to bypass YouTube: ${error.message}`);
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
