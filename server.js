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

// YouTubeの動画データを自分のサーバー経由で配信するAPI（CORSを完全回避）
app.get('/api/stream', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Missing url parameter');
    }

    // ShortsなどのURLを標準のwatch形式に簡易変換
    if (videoUrl.includes('/shorts/')) {
        videoUrl = videoUrl.replace('/shorts/', '/watch?v=');
    }

    try {
        // YouTubeのボット検知を極力回避するための設定を付与して情報を取得
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });

        // 音声と映像が両方含まれる最も高画質なフォーマットを選択
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highest', 
            filter: 'videoandaudio' 
        });

        if (!format) {
            return res.status(404).send('No suitable format found');
        }

        // 自分のサーバーからの配信としてヘッダーを偽装・出力
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // データをリアルタイムでパイプ転送（独自ストリーミング）
        ytdl(videoUrl, { 
            format: format,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        }).pipe(res);

    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).send(`Error streaming video: ${error.message}`);
    }
});

// ファビコンの404エラー対策
app.get('/favicon.ico', (req, res) => res.status(204).end());

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
